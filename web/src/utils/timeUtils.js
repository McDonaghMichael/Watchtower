export const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('en-UK', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };