const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function postReview(payload: { code: string; filename?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/reviews/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to submit code review.');
  }

  return response.json();
}
