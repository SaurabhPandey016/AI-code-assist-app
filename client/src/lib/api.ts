const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
import { getAccessToken } from './auth';

export async function createChat() {
  const response = await fetch(`${API_BASE_URL}/api/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to create a new chat.');
  }

  return response.json();
}

export async function listChats() {
  const response = await fetch(`${API_BASE_URL}/api/chats`, { headers: { ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) }, credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to load chat history.');
  }
  return response.json();
}

export async function fetchChatMessages(chatId: string) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, { headers: { ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) }, credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to load chat messages.');
  }
  return response.json();
}

export async function editChatTitle(chatId: string, title: string) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to rename chat.');
  }

  return response.json();
}

export async function deleteChat(chatId: string) {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: { ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to delete chat.');
  }

  return response.json();
}

export async function postChatMessage(payload: { chatId: string; content?: string; code?: string; file?: File | null }) {
  const formData = new FormData();
  formData.append('content', payload.content || '');
  formData.append('code', payload.code || '');
  if (payload.file) {
    formData.append('file', payload.file);
  }

  const response = await fetch(`${API_BASE_URL}/api/chats/${payload.chatId}/messages`, {
    method: 'POST',
    body: formData,
    headers: { ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to submit review.');
  }

  return response.json();
}
