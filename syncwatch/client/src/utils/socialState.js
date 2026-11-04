// Default mock database in localStorage
const DEFAULT_USERS = [
  { username: 'anmol', name: 'Anmol Verma' },
  { username: 'kundan', name: 'Kundan Kumar' },
  { username: 'pranav', name: 'Pranav Sharma' },
  { username: 'avinash', name: 'Avinash Singh' },
  { username: 'rahul', name: 'Rahul Roy' }
];

export const getStoredUsers = () => {
  try {
    const data = localStorage.getItem('scane_all_users');
    return data ? JSON.parse(data) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

export const registerUser = (username, name) => {
  const users = getStoredUsers();
  const cleanUsername = username.trim().toLowerCase();
  if (!users.some(u => u.username === cleanUsername)) {
    users.push({ username: cleanUsername, name: name || username });
    localStorage.setItem('scane_all_users', JSON.stringify(users));
  }
};

export const getSocialData = (username) => {
  const clean = username?.toLowerCase();
  const defaultData = {
    friends: ['kundan', 'pranav'],
    incomingRequests: ['avinash'],
    outgoingRequests: [],
    notifications: [
      { id: 'notif-1', type: 'friend_request', from: 'avinash', time: '5m ago' }
    ],
    directMessages: {
      kundan: [
        { sender: 'kundan', text: 'Bro, movie ready hai kya?', time: '17:30' },
        { sender: clean, text: 'Haan bhai, upload kar diya hai.', time: '17:32' }
      ]
    }
  };

  try {
    const raw = localStorage.getItem(`scane_social_${clean}`);
    return raw ? JSON.parse(raw) : defaultData;
  } catch {
    return defaultData;
  }
};

export const saveSocialData = (username, data) => {
  try {
    localStorage.setItem(`scane_social_${username.toLowerCase()}`, JSON.stringify(data));
  } catch (e) {}
};