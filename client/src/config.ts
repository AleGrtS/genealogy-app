const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const getUploadsUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001/uploads`;
  }
  return 'http://localhost:3001/uploads';
};

const config = {
  API_URL: getBaseUrl(),
  UPLOADS_URL: getUploadsUrl()
};

console.log('🔧 Config loaded:', config);

export default config;
