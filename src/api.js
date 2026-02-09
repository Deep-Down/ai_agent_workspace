export const api = {
  sendMessage: async (projectId, text, attachments = []) => {
    console.log('Отправка сообщения:', { projectId, text, attachments });

    if (attachments.length === 0) {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          projectId: projectId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }

    const formData = new FormData();

    formData.append('projectId', projectId);
    formData.append('message', text);

    const allMeta = attachments.map(file => ({
      name: file.name,
      type: file.type || (file.blob ? 'audio' : 'doc'),
      size: file.size || file.blob?.size
    }));

    formData.append('filesMeta', JSON.stringify(allMeta));

    // Добавляем файлы
    attachments.forEach((file) => {
      const fileBlob = file.blob || file.file;
      if (fileBlob) {
        formData.append('files', fileBlob, file.name);
      }
    });

    console.log('Отправка FormData с файлами...');

    const response = await fetch('http://localhost:8000/chat-with-files', {
      method: 'POST',
      body: formData
    });
    console.log('Статус ответа:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Ответ получен:', result);
      return result;

  },

  generateDocx: async (markdown) => {
    const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: JSON.stringify({
          message: markdown,
        })
      });

  }
};