import React, { useState, useRef } from 'react';
import { 
  PlusCircle, MessageSquare, Settings, Star, 
  FileText, Send, Download, ChevronRight, ChevronLeft,
  Paperclip, User, Bot, Trash2
} from 'lucide-react';

const App = () => {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Привет! Я ваш ИИ-ассистент. Прикрепите расшифровку встречи (txt/docx), и я сформирую протокол обследования.', time: '12:00' }
  ]);
  const [inputText, setInputText] = useState("");
  const [extractedMarkdown, setExtractedMarkdown] = useState("### Протокол обследования №1\n\n**Дата:** 05.02.2026\n**Участники:** Аналитик, Заказчик\n\n#### Основные тезисы:\n- Обсудили требования к фронтенду...\n- Согласовали стек технологий (React + Tailwind).");
  
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage = { id: Date.now(), role: 'user', content: inputText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setMessages([...messages, newMessage]);
    setInputText("");
    // Здесь коллеги подключат логику ответа ИИ
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Файл "${file.name}" выбран. Здесь сработает логика отправки расшифровки на сервер.`);
      // Логика: отправить файл -> получить markdown -> setExtractedMarkdown
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-slate-900 font-sans overflow-hidden">
      
      {/* ЛЕВАЯ ПАНЕЛЬ: В стиле Telegram Sidebar */}
      <aside className="w-72 bg-[#1c242f] text-white flex flex-col border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <button className="w-full flex items-center justify-center gap-2 bg-[#3390ec] hover:bg-[#2b7ad1] p-2.5 rounded-xl transition-all font-medium">
            <PlusCircle size={20} />
            <span>Новый проект</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase px-3 py-2 tracking-wider">Ваши проекты</div>
          {[
            { name: 'Проект Альфа', active: true },
            { name: 'Анализ рынка', active: false },
            { name: 'Встреча ТОП', active: false }
          ].map((chat) => (
            <button key={chat.name} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${chat.active ? 'bg-[#3390ec]' : 'hover:bg-slate-800'}`}>
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold">
                {chat.name[0]}
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-sm font-semibold truncate">{chat.name}</div>
                <div className="text-xs opacity-60 truncate">Аналитическая записка...</div>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-1 bg-[#171e28]">
          <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-slate-400 text-sm transition-colors">
            <Star size={18} /> <span>Избранное</span>
          </button>
          <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg text-slate-400 text-sm transition-colors">
            <Settings size={18} /> <span>Настройки</span>
          </button>
        </div>
      </aside>

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: TG Chat */}
      <main className="flex-1 flex flex-col bg-[#e7ebf0] relative shadow-inner">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">ИИ</div>
            <div>
              <h2 className="font-bold text-sm">Аналитик-Ассистент</h2>
            </div>
          </div>
          <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            {isRightPanelOpen ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </header>

        {/* Область сообщений с фоном */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-opacity-20 bg-[url('https://i.pinimg.com/originals/85/6e/33/856e334857f393d1f116664003957297.jpg')] bg-center">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative shadow-sm ${msg.role === 'user' ? 'bg-[#effdde] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className="text-[10px] text-slate-400 block text-right mt-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t flex justify-center">
          <div className="max-w-3xl w-full flex items-end gap-2 bg-[#f4f4f5] rounded-2xl p-2 border border-slate-200 focus-within:border-blue-400 transition-all">
            <button 
              onClick={() => fileInputRef.current.click()}
              className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
            >
              <Paperclip size={22} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".txt,.docx,.pdf"
            />
            <textarea 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32"
              placeholder="Напишите сообщение..."
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
      </main>

      {/* ПРАВАЯ ПАНЕЛЬ: Редактор протокола */}
      {isRightPanelOpen && (
        <aside className="w-[450px] bg-white border-l flex flex-col shadow-2xl z-20">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Черновик документа
            </h3>
            <button className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex-1 p-8 bg-[#f8fafc] overflow-y-auto">
            <div className="bg-white p-8 shadow-md min-h-full rounded-sm border border-slate-200">
              <textarea
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none font-serif text-slate-800 leading-loose"
                value={extractedMarkdown}
                onChange={(e) => setExtractedMarkdown(e.target.value)}
                placeholder="ИИ сгенерирует текст здесь..."
              />
            </div>
          </div>

          <div className="p-5 border-t bg-white space-y-3">
            <button className="w-full flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f70] text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-emerald-100">
              <Download size={20} />
              Импортировать в DOCX
            </button>
            <p className="text-[11px] text-slate-400 text-center italic">
              * Документ будет автоматически проверен на соответствие шаблону ГОСТ / Корпоративный.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;