/* ИИ-наставник: подсказка нейросети, когда ученик по-настоящему застрял.
   Открывается для задачи только если: задача не решена, было не меньше 3 неудачных проверок,
   все обычные подсказки уже открыты и на задачу потрачено не меньше 30 минут активной работы.
   Провайдеры (всё бесплатно):
   - browser: модель прямо в браузере (WebLLM + WebGPU), ничего не нужно настраивать, ~1 ГБ скачивается один раз;
   - ollama:  локальная модель на компьютере (https://ollama.com), например qwen3:8b;
   - openai:  любой совместимый API со своим ключом (Groq, OpenRouter, Google Gemini — у всех есть бесплатные лимиты). */
(function () {
  'use strict';
  var NEED_MS = 30 * 60 * 1000;   // 30 минут активной работы
  var NEED_FAILS = 3;
  var IDLE_MS = 5 * 60 * 1000;    // перерыв больше 5 минут не считается работой
  var EFFORT_KEY = 'ccourse.effort.v1', CFG_KEY = 'ccourse.ai.v1';
  var WEBLLM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  var effort = load(EFFORT_KEY, {});
  var cfg = load(CFG_KEY, { provider: 'browser', browserModel: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', ollamaUrl: 'http://localhost:11434', ollamaModel: 'qwen3:8b', apiUrl: 'https://api.groq.com/openai/v1', apiModel: 'llama-3.3-70b-versatile', apiKey: '' });

  /* ---------- учёт усилий ---------- */
  function E(key) { return effort[key] || (effort[key] = { ms: 0, last: 0, fails: 0, asks: 0 }); }
  function touch(key) {
    var e = E(key), now = Date.now();
    if (e.last && now - e.last < IDLE_MS) e.ms += now - e.last;
    e.last = now;
    save(EFFORT_KEY, effort);
  }
  function fail(key) { var e = E(key); e.fails++; touch(key); }
  function status(key, hintsLeft) {
    var e = E(key);
    var left = [];
    if (e.fails < NEED_FAILS) left.push('ещё ' + (NEED_FAILS - e.fails) + ' неудачн. проверк.');
    if (hintsLeft > 0) left.push('открыть все подсказки');
    if (e.ms < NEED_MS) left.push('ещё ~' + Math.ceil((NEED_MS - e.ms) / 60000) + ' мин работы над задачей');
    return { open: left.length === 0, left: left, minutes: Math.floor(e.ms / 60000), fails: e.fails };
  }

  /* ---------- запрос к модели ---------- */
  var SYSTEM = 'Ты — доброжелательный наставник по языку C для студента первого курса. Студент долго не может решить задачу. ' +
    'Правила: 1) НЕ пиши готовое решение и не переписывай программу целиком; 2) найди главную ошибку или недопонимание и объясни её по-русски простыми словами; ' +
    '3) укажи номер строки или фрагмент кода, где проблема; 4) задай один наводящий вопрос и предложи следующий шаг; ' +
    '5) пример кода — не больше 5 строк и только для иллюстрации идеи, не решение; 6) ответ — не длиннее 15 строк.';

  function buildPrompt(p) {
    return 'Условие задачи:\n' + p.task + '\n\nКод студента (main.c):\n```c\n' + p.code.split('\n').map(function (l, i) { return (i + 1) + ': ' + l; }).join('\n') + '\n```\n\n' +
      'Результат последней проверки:\n' + (p.result || 'нет данных') + '\n\n' + (p.question ? 'Вопрос студента: ' + p.question + '\n\n' : '') +
      'Помоги понять, что не так, не давая готового решения.';
  }
  function clean(t) { return String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); }

  var engine = null, engineModel = null;
  async function askBrowser(messages, onProgress) {
    if (!navigator.gpu) throw new Error('Этот браузер не поддерживает WebGPU. Открой курс в свежем Chrome или Edge либо выбери Ollama или API в настройках.');
    if (!engine || engineModel !== cfg.browserModel) {
      onProgress('Загружаю модель в браузер (первый раз — несколько минут, дальше из кеша)…');
      var webllm = await import(WEBLLM);
      engine = await webllm.CreateMLCEngine(cfg.browserModel, { initProgressCallback: function (r) { onProgress(r.text); } });
      engineModel = cfg.browserModel;
    }
    onProgress('Думаю…');
    var r = await engine.chat.completions.create({ messages: messages, temperature: 0.3, max_tokens: 700 });
    return r.choices[0].message.content;
  }
  async function askOllama(messages, onProgress) {
    onProgress('Спрашиваю локальную модель ' + cfg.ollamaModel + '…');
    var resp;
    try {
      resp = await fetch(cfg.ollamaUrl.replace(/\/$/, '') + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cfg.ollamaModel, messages: messages, stream: false, think: false, options: { temperature: 0.3 } }),
      });
    } catch (e) {
      throw new Error('Нет связи с Ollama по адресу ' + cfg.ollamaUrl + '. Запущена ли программа Ollama? Если курс открыт с сайта, разреши ему доступ: переменная окружения OLLAMA_ORIGINS (инструкция в настройках наставника).');
    }
    if (!resp.ok) throw new Error('Ollama ответила ошибкой ' + resp.status + (resp.status === 404 ? ': нет модели ' + cfg.ollamaModel + ' (ollama pull ' + cfg.ollamaModel + ')' : ''));
    var j = await resp.json();
    return j.message && j.message.content;
  }
  async function askApi(messages, onProgress) {
    if (!cfg.apiKey) throw new Error('Не указан ключ API. Открой настройки наставника.');
    onProgress('Спрашиваю ' + cfg.apiModel + '…');
    var resp = await fetch(cfg.apiUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.apiModel, messages: messages, temperature: 0.3, max_tokens: 700 }),
    });
    if (!resp.ok) { var txt = ''; try { txt = (await resp.text()).slice(0, 200); } catch (e) { } throw new Error('API ответил ошибкой ' + resp.status + '. ' + txt); }
    var j = await resp.json();
    return j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  }
  async function ask(key, parts, onProgress) {
    var messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: buildPrompt(parts) }];
    var f = cfg.provider === 'ollama' ? askOllama : cfg.provider === 'openai' ? askApi : askBrowser;
    var text = clean(await f(messages, onProgress || function () { }));
    if (!text) throw new Error('Модель вернула пустой ответ.');
    E(key).asks++; save(EFFORT_KEY, effort);
    return text;
  }

  /* ---------- оформление ответа ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function render(md) {
    var parts = String(md).split(/```[a-zA-Z]*\n?/);
    return parts.map(function (p, i) {
      if (i % 2) return '<pre class="code"><code>' + esc(p.replace(/\n$/, '')) + '</code></pre>';
      return esc(p).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
    }).map(function (h, i) { return i % 2 ? h : '<p>' + h + '</p>'; }).join('');
  }

  /* ---------- настройки ---------- */
  var PRESETS = {
    groq: { apiUrl: 'https://api.groq.com/openai/v1', apiModel: 'llama-3.3-70b-versatile', note: 'console.groq.com → API Keys (бесплатный лимит)' },
    openrouter: { apiUrl: 'https://openrouter.ai/api/v1', apiModel: 'deepseek/deepseek-chat-v3-0324:free', note: 'openrouter.ai → Keys; модели с «:free» бесплатны' },
    gemini: { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', apiModel: 'gemini-2.0-flash', note: 'aistudio.google.com → Get API key (бесплатный лимит)' },
  };
  function settingsHtml() {
    var o = location.origin.indexOf('http') === 0 ? location.origin : 'https://gosha1818.github.io';
    function opt(v, t) { return '<option value="' + v + '"' + (cfg.provider === v ? ' selected' : '') + '>' + t + '</option>'; }
    return '<div class="ai-settings">'
      + '<label class="ai-row"><span>Где работает нейросеть</span><select data-k="provider">' + opt('browser', 'В браузере (WebLLM, без настройки)') + opt('ollama', 'Ollama на моём компьютере') + opt('openai', 'Бесплатный API со своим ключом') + '</select></label>'
      + '<div data-p="browser"><label class="ai-row"><span>Модель</span><select data-k="browserModel">'
      + ['Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC', 'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC'].map(function (m) { return '<option' + (cfg.browserModel === m ? ' selected' : '') + '>' + m + '</option>'; }).join('')
      + '</select></label><p class="small muted">Нужен Chrome или Edge с WebGPU. 1.5B — около 1 ГБ, 7B — около 4,5 ГБ (умнее, но нужна хорошая видеокарта). Скачивается один раз.</p></div>'
      + '<div data-p="ollama"><label class="ai-row"><span>Адрес</span><input data-k="ollamaUrl" value="' + esc(cfg.ollamaUrl) + '"></label><label class="ai-row"><span>Модель</span><input data-k="ollamaModel" value="' + esc(cfg.ollamaModel) + '"></label>'
      + '<p class="small muted">Установи <a href="https://ollama.com" target="_blank" rel="noopener">Ollama</a> и модель (<code>ollama pull qwen3:8b</code>). Чтобы сайт мог обращаться к Ollama, один раз выполни в PowerShell и перезапусти Ollama:</p><pre class="code"><code>[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "' + esc(o) + '", "User")</code></pre></div>'
      + '<div data-p="openai"><div class="row small" style="margin-bottom:6px">Быстрый выбор: <button class="btn sm" type="button" data-preset="groq">Groq</button><button class="btn sm" type="button" data-preset="openrouter">OpenRouter</button><button class="btn sm" type="button" data-preset="gemini">Google Gemini</button></div>'
      + '<label class="ai-row"><span>Адрес API</span><input data-k="apiUrl" value="' + esc(cfg.apiUrl) + '"></label><label class="ai-row"><span>Модель</span><input data-k="apiModel" value="' + esc(cfg.apiModel) + '"></label><label class="ai-row"><span>Ключ</span><input data-k="apiKey" type="password" autocomplete="off" value="' + esc(cfg.apiKey) + '"></label>'
      + '<p class="small muted ai-preset-note">Ключ хранится только в этом браузере и отправляется только на указанный адрес API.</p></div>'
      + '</div>';
  }
  function bindSettings(root) {
    function sync() { $$('[data-p]', root).forEach(function (d) { d.hidden = d.dataset.p !== cfg.provider; }); }
    $$('[data-k]', root).forEach(function (el) { el.onchange = el.oninput = function () { cfg[el.dataset.k] = el.value.trim(); save(CFG_KEY, cfg); sync(); }; });
    $$('[data-preset]', root).forEach(function (b) {
      b.onclick = function () {
        var p = PRESETS[b.dataset.preset];
        cfg.apiUrl = p.apiUrl; cfg.apiModel = p.apiModel; save(CFG_KEY, cfg);
        root.querySelector('[data-k="apiUrl"]').value = p.apiUrl; root.querySelector('[data-k="apiModel"]').value = p.apiModel;
        root.querySelector('.ai-preset-note').textContent = 'Ключ: ' + p.note + '. Хранится только в этом браузере.';
      };
    });
    sync();
  }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  window.AI = { touch: touch, fail: fail, status: status, ask: ask, render: render, settingsHtml: settingsHtml, bindSettings: bindSettings, NEED_FAILS: NEED_FAILS, NEED_MIN: NEED_MS / 60000 };
})();
