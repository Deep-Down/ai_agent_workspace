import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import {
  PlusCircle, Settings, Star, FileText, Send, Download,
  ChevronRight, ChevronLeft, Paperclip,
  FileAudio, Loader2, FileType, AlertCircle, X,
  Save, Sliders, Cpu, Database, Network, GitBranch
} from 'lucide-react';

import { api } from './api';

const App = () => {
  // --- СОСТОЯНИЯ ИНТЕРФЕЙСА ---
  const [attachedFiles, setAttachedFiles] = useState([]); // Файлы, которые ждут отправки
  const [view, setView] = useState('chat'); // 'chat' | 'settings'
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- ДАННЫЕ ПРОЕКТОВ (Mock Data) ---
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Аудит сайта (Альфа)',
      parentId: null,
      messages: [
        { id: 1, role: 'ai', content: 'Привет! Это проект "Аудит сайта". Загрузите видео встречи.', time: '10:00' }
      ],
      markdown: ''
    },
    {
      id: 2,
      name: 'Тех. задание (Бета)',
      parentId: 1, // Ссылка на первый проект
      messages: [
        { id: 1, role: 'ai', content: 'Проект создан на основе "Аудит сайта". Я помню контекст предыдущего обсуждения.', time: '14:20' }
      ],
      markdown: '### Черновик ТЗ\nНа основе аудита...'
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState(1);

  // Получаем активный проект для удобства
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // --- СОСТОЯНИЯ ФОРМ ---
  const [inputText, setInputText] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // Настройки (Local Hosting Config)
  const [settings, setSettings] = useState({
    model: "llama-3-8b-local",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: "Ты опытный системный аналитик. Твоя задача — извлекать структурированные данные из транскриптов.",
    serverUrl: "http://localhost:8000"
  });

  // --- ТЕХНИЧЕСКИЕ СОСТОЯНИЯ (FFmpeg) ---
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const ffmpegRef = useRef(new FFmpeg());
  const fileInputRef = useRef(null);

  // --- ИНИЦИАЛИЗАЦИЯ ---
  useEffect(() => { loadFFmpeg(); }, []);

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log(message));
    ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)));
    if (!ffmpeg.loaded) {
      try { await ffmpeg.load(); } catch (e) { console.error("FFmpeg load err:", e); }
    }
  };

  // --- ЛОГИКА ПРОЕКТОВ ---
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject = {
      id: Date.now(),
      name: newProjectName,
      parentId: selectedParentId || null, // null если это корневой проект
      messages: [
        { id: Date.now(), role: 'ai', content: `Проект "${newProjectName}" создан. ${selectedParentId ? 'Контекст родительского проекта подключен.' : 'Жду материалов.'}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ],
      markdown: ''
    };

    // TODO: BACKEND - Здесь отправить запрос на создание проекта: POST /api/projects/create { name, parentId }

    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    setView('chat');
    setIsCreateModalOpen(false);
    setNewProjectName("");
    setSelectedParentId("");
  };

  const switchProject = (id) => {
    setActiveProjectId(id);
    setView('chat');
  };

  // --- ЛОГИКА ЧАТА ---
  const handleSend = async () => {
      if (!inputText.trim() && attachedFiles.length === 0) return;

      // 1. Создаем сообщение пользователя
      const newMessage = {
        id: Date.now(), // <- Исправлено: Date.now() вместо Date.now
        projectId: activeProjectId, // <- Исправлено: projectId вместо proj_id
        role: 'user',
        content: inputText,
        attachments: attachedFiles,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // 2. Обновляем состояние
      setProjects(prev => prev.map(p =>
        p.id === activeProjectId ? { ...p, messages: [...p.messages, newMessage] } : p
      ));

      setInputText("");
      setAttachedFiles([]);

      try {
        console.log('Отправка запроса на сервер...');
        const response = await api.sendMessage(activeProjectId, inputText, attachedFiles);

        // 4. Добавляем ответ AI
        if (response && response.success) {
          const aiMessage = {
            id: Date.now() + 1,
            projectId: activeProjectId,
            role: 'ai',
            content: response.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setProjects(prev => prev.map(p =>
            p.id === activeProjectId ? { ...p, messages: [...p.messages, aiMessage] } : p
          ));
        } else {
          console.error('Ошибка от сервера:', response);
        }
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);

        // Показываем сообщение об ошибке
        const errorMessage = {
          id: Date.now() + 1,
          projectId: activeProjectId,
          role: 'ai',
          content: 'Ошибка соединения с сервером. Проверьте, запущен ли бэкенд на порту 8000.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setProjects(prev => prev.map(p =>
          p.id === activeProjectId ? { ...p, messages: [...p.messages, errorMessage] } : p
        ));
      }
    };


  const handleDocUpdate = (text) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, markdown: text } : p));
  };

  // --- ЛОГИКА ФАЙЛОВ (FFmpeg) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;

    const isVideo = file.type.startsWith('video/');
    const isDoc = ['.txt', '.doc', '.docx', '.pdf'].some(ext => file.name.toLowerCase().endsWith(ext));

    if (isVideo) {
      setIsConverting(true);
      setStatusText("Извлечение аудио...");
      try {
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg.loaded) await ffmpeg.load();

        await ffmpeg.writeFile('input.mp4', await fetchFile(file));
        await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-q:a', '5', 'output.mp3']);

        const data = await ffmpeg.readFile('output.mp3');
        const audioBlob = new Blob([data.buffer], { type: 'audio/mp3' });

        const audioAttachment = {
          id: Date.now,
          name: `${file.name.split('.')[0]}.mp3`,
          size: (audioBlob.size / 1024 / 1024).toFixed(1) + ' MB',
          oldSize: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          type: 'audio',
          blob: audioBlob
        };
        setAttachedFiles(prev => [...prev, audioAttachment]);
      } catch (err) { alert("Ошибка конвертации"); }
      finally { setIsConverting(false); setProgress(0); }
    } else if (isDoc) {
      const fileExt = file.name.toLowerCase().split('.').pop();
      const fileType = fileExt === 'txt' ? 'txt' : 'doc';

      setAttachedFiles(prev => [...prev, {
        id: Date.now(),
        name: file.name,
        type: fileType,
        file: file
      }]);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-slate-900 font-sans overflow-hidden relative">

      {/* --- МОДАЛКА: СОЗДАНИЕ ПРОЕКТА --- */}
      {isCreateModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
          <div className="w-96 bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Новый проект</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Название</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Например: Встреча с заказчиком..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>


              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <GitBranch size={12} /> Продолжение проекта (Context)
                </label>
                <select
                  className="w-full mt-1 p-2 border rounded-lg bg-slate-50 outline-none"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">-- Без родительского проекта --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  * ИИ получит доступ к истории и документам выбранного родительского проекта.
                </p>
              </div>

              <button
                onClick={handleCreateProject}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-all mt-2 shadow-lg shadow-blue-200"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- МОДАЛКА: КОНВЕРТАЦИЯ (Твоя старая) --- */}
      {isConverting && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center flex-col text-white">
          <div className="w-80 text-center">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1">Оптимизация видео</h3>
            <p className="text-xs text-slate-400 mb-4">{statusText}</p>
            <div className="w-full h-1.5 bg-slate-800 rounded-full"><div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>
      )}

      {/* --- ЛЕВОЕ МЕНЮ (Сайдбар) --- */}
      <aside className="w-72 bg-[#1c242f] text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-4 border-b border-slate-800">
          <button onClick={() => setIsCreateModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#3390ec] hover:bg-[#2b7ad1] p-2.5 rounded-xl transition-all font-medium text-sm">
            <PlusCircle size={18} /> <span>Новый проект</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 tracking-wider">Активные проекты</div>
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => switchProject(proj.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative ${activeProjectId === proj.id && view === 'chat' ? 'bg-[#3390ec] shadow-lg' : 'hover:bg-slate-800'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${activeProjectId === proj.id ? 'bg-white/20' : 'bg-slate-700'}`}>
                {proj.name[0]}
              </div>
              <div className="text-left overflow-hidden flex-1">
                <div className="text-sm font-medium truncate">{proj.name}</div>
                {proj.parentId && (
                  <div className="flex items-center gap-1 text-[10px] opacity-60">
                    <GitBranch size={10} /> <span>ветка от #{proj.parentId}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>


        <div className="p-4 space-y-1 bg-[#171e28] border-t border-slate-800">
          <button
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${view === 'settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={18} /> <span>Настройки</span>
          </button>
        </div>
      </aside>

      {/* --- ОСНОВНАЯ ОБЛАСТЬ (Свичер между Чатом и Настройками) --- */}

      {view === 'settings' ? (
        // --- СТРАНИЦА НАСТРОЕК ---
        <main className="flex-1 bg-[#f8fafc] overflow-y-auto p-10">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Settings className="text-blue-500" /> Настройки Агента
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-medium text-slate-700 flex items-center gap-2">
                <Cpu size={18} /> Модель и Интеллект
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">LLM Модель</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  >
                    <option value="llama-3-8b-local">Llama 3 (8B) - Local Optimized</option>
                    <option value="mistral-7b">Mistral 7B Instruct</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Cloud)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">Температура (Креативность)</label>
                    <span className="text-sm text-blue-600 font-bold">{settings.temperature}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Точно (Факты)</span>
                    <span>Креативно (Генерация)</span>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-medium text-slate-700 flex items-center gap-2">
                <Database size={18} /> Системные параметры
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Системный Промпт (Роль)</label>
                  <textarea
                    className="w-full p-3 border rounded-lg h-24 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                  />
                  {/* TODO: BACKEND - Сохранить промпт в конфиг сервера */}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Network size={16} /> Локальный сервер API
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg text-sm font-mono text-slate-600 bg-slate-50"
                    value={settings.serverUrl}
                    onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setView('chat')} className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-medium transition-colors">Отмена</button>
              <button className="px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold shadow-lg shadow-green-100 flex items-center gap-2">
                <Save size={18} /> Сохранить
              </button>
            </div>

          </div>
        </main>
      ) : (
        // --- ОКНО ЧАТА (Обычный вид) ---
        <main className="flex-1 flex flex-col bg-[#e7ebf0] relative shadow-inner">
          <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {activeProject.name[0]}
              </div>
              <div>
                <h2 className="font-bold text-sm flex items-center gap-2">
                  {activeProject.name}
                  {activeProject.parentId && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border">Ветка от #{activeProject.parentId}</span>}
                </h2>
                <p className="text-[10px] text-green-500 font-medium">Llama-3 Connected • Low Latency</p>
              </div>
            </div>
            <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              {isRightPanelOpen ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-opacity-20 bg-[url('https://i.pinimg.com/originals/85/6e/33/856e334857f393d1f116664003957297.jpg')] bg-center">
            {activeProject.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-1 py-1 rounded-2xl relative shadow-sm text-sm ${msg.role === 'user' ? 'bg-[#effdde] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                  {msg.content && <p className="px-3 py-2 leading-relaxed">{msg.content}</p>}


                  {/* синий блок для аудио */}
                  {msg.attachments?.map(file => (
                    <div key={file.id} className="m-1">
                      {file.type === 'audio' ? (
                        <div className="flex items-center gap-3 bg-[#3390ec] text-white p-3 rounded-xl min-w-[250px]">
                          <div className="bg-white/20 p-2 rounded-full"><FileAudio size={22} /></div>
                          <div className="flex-1">
                            <div className="text-[13px] font-bold truncate w-40">{file.name}</div>
                            <div className="text-[10px] opacity-80">Audio • {file.oldSize} → {file.size}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200 text-slate-600">
                          <FileType size={18} /> <span className="text-xs font-medium">{file.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-400 block text-right px-2 pb-1">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t shrink-0">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">

              {/* Превью прикрепленных файлов над строкой ввода */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 pl-3 pr-1 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-600 animate-in zoom-in-95">
                      {file.name}
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* строка ввода */}
              <div className="flex items-end gap-2 bg-[#f4f4f5] rounded-2xl p-2 border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all">
                <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                  <Paperclip size={22} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="video/*, .txt, .doc, .docx, .pdf" />
                <textarea
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none ring-0 text-sm py-2 resize-none max-h-32"
                  placeholder="Напишите сообщение или пояснение к файлам..."
                  rows="1"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <button onClick={handleSend} className="p-2 bg-[#3390ec] text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}


      {/* --- ПРАВАЯ ПАНЕЛЬ (ДОКУМЕНТ) --- */}
      {view === 'chat' && isRightPanelOpen && (
        <aside className="w-[450px] bg-white border-l flex flex-col shadow-2xl z-20 shrink-0">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Протокол / Записка
            </h3>
          </div>
          <div className="flex-1 p-8 bg-[#f8fafc] overflow-y-auto">
            <div className="bg-white p-8 shadow-md min-h-full rounded-sm border border-slate-200">
              <textarea
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none font-serif text-slate-800 leading-loose"
                value={activeProject.markdown}
                onChange={(e) => handleDocUpdate(e.target.value)}
                placeholder="Здесь будет сформирован документ по текущему проекту..."
              />
            </div>
          </div>
          <div className="p-5 border-t bg-white space-y-3">
            <button className="w-full flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f70] text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-emerald-100">
              <Download size={20} /> Экспорт DOCX
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;
