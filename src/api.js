export const api = {
  // Отправка сообщения в чат и получение ответа от ИИ
//  sendMessage: async (text) => {
//    const response = await fetch('http://localhost:8000/chat', {
//      method: 'POST',
//      body: JSON.stringify({ message: text }),
//      headers: { 'Content-Type': 'application/json' }
//    });
//    return response.json();
//  },
  sendMessage: async (projectId, text, attachments = []) => {
  if (attachments.length === 0) {

    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        projectId: projectId
      })
    });
    return response.json();
  }

  const allMeta = attachments.map(file => ({
  name: file.name,
  type: file.type,
  size: file.size
  }));

  formData.append('projectId', projectId);
  formData.append('message', text);
  formData.append('filesMeta', JSON.stringify(allMeta));  // ← ОДНО поле

  attachments.forEach((file, index) => {
    if (file.blob) {
      formData.append(`file_${index}`, file.blob, file.name);
    }
  });

  const response = await fetch('http://localhost:8000/chat-with-files', {
    method: 'POST',
    body: formData
  });
  return response.json();
}

  // Отправка Markdown для генерации DOCX
  generateDocx: async (markdown) => {
    // Здесь будет логика скачивания файла
    console.log("Отправляем на сервер:", markdown);
  }
};
