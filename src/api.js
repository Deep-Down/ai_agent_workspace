export const api = {
  // Отправка сообщения в чат и получение ответа от ИИ
  sendMessage: async (text) => {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // Отправка Markdown для генерации DOCX
  generateDocx: async (markdown) => {
    // Здесь будет логика скачивания файла
    console.log("Отправляем на сервер:", markdown);
  }
};