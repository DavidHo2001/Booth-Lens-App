export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // 格式化為 YYYY/MM/DD HH:mm (可依據需求調整)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};