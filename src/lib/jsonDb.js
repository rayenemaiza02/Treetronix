import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'local_db.json');

// Ensure database file and directory exists
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      clients: [],
      portals: [],
      portalhistories: [],
      connectionstats: []
    }, null, 2));
  }
}

// Read from JSON file
function readData() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON DB file, returning empty database structure", error);
    return {
      clients: [],
      portals: [],
      portalhistories: [],
      connectionstats: []
    };
  }
}

// Write to JSON file
function writeData(data) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing JSON DB file", error);
  }
}

// Generate simple unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 9);
}

export const jsonDb = {
  clients: {
    find: async (query = {}) => {
      const data = readData();
      return data.clients.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findOne: async (query = {}) => {
      const data = readData();
      return data.clients.find(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    findById: async (id) => {
      const data = readData();
      return data.clients.find(item => item._id === id) || null;
    },
    create: async (doc) => {
      const data = readData();
      const newDoc = {
        _id: generateId(),
        createdAt: new Date().toISOString(),
        sector: 'other',
        ...doc
      };
      data.clients.push(newDoc);
      writeData(data);
      return newDoc;
    },
    findByIdAndUpdate: async (id, update) => {
      const data = readData();
      const index = data.clients.findIndex(item => item._id === id);
      if (index === -1) return null;
      data.clients[index] = { ...data.clients[index], ...update };
      writeData(data);
      return data.clients[index];
    },
    deleteOne: async (query) => {
      const data = readData();
      const initialCount = data.clients.length;
      data.clients = data.clients.filter(item => {
        for (let key in query) {
          if (item[key] === query[key]) return false;
        }
        return true;
      });
      writeData(data);
      return { deletedCount: initialCount - data.clients.length };
    }
  },

  portals: {
    find: async (query = {}) => {
      const data = readData();
      return data.portals.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    },
    findOne: async (query = {}) => {
      const data = readData();
      return data.portals.find(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    },
    findById: async (id) => {
      const data = readData();
      return data.portals.find(item => item._id === id) || null;
    },
    create: async (doc) => {
      const data = readData();
      const newDoc = {
        _id: generateId(),
        name: '',
        isActive: true,
        logoUrl: '',
        backgroundImageUrl: '',
        primaryColor: '#8b5cf6',
        backgroundColor: '#0f172a',
        textColor: '#f8fafc',
        welcomeText: 'Bienvenue sur notre réseau Wi-Fi',
        buttonText: 'Se connecter',
        termsOfUse: 'En vous connectant, vous acceptez les conditions d\'utilisation.',
        promoBannerUrl: '',
        authType: 'button',
        templateName: 'glassmorphism',
        version: 1,
        updatedAt: new Date().toISOString(),
        ...doc
      };
      data.portals.push(newDoc);
      writeData(data);
      return newDoc;
    },
    findByIdAndUpdate: async (id, update) => {
      const data = readData();
      const index = data.portals.findIndex(item => item._id === id);
      if (index === -1) return null;
      data.portals[index] = { 
        ...data.portals[index], 
        ...update, 
        updatedAt: new Date().toISOString() 
      };
      writeData(data);
      return data.portals[index];
    },
    deleteOne: async (query) => {
      const data = readData();
      const initialCount = data.portals.length;
      data.portals = data.portals.filter(item => {
        for (let key in query) {
          if (item[key] === query[key]) return false;
        }
        return true;
      });
      writeData(data);
      return { deletedCount: initialCount - data.portals.length };
    }
  },

  portalhistories: {
    find: async (query = {}) => {
      const data = readData();
      return data.portalhistories
        .filter(item => {
          for (let key in query) {
            if (item[key] !== query[key]) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    },
    create: async (doc) => {
      const data = readData();
      const newDoc = {
        _id: generateId(),
        modifiedAt: new Date().toISOString(),
        modifiedBy: 'Admin',
        description: '',
        ...doc
      };
      data.portalhistories.push(newDoc);
      writeData(data);
      return newDoc;
    },
    deleteMany: async (query) => {
      const data = readData();
      const initialCount = data.portalhistories.length;
      data.portalhistories = data.portalhistories.filter(item => {
        for (let key in query) {
          if (item[key] === query[key]) return false;
        }
        return true;
      });
      writeData(data);
      return { deletedCount: initialCount - data.portalhistories.length };
    }
  },

  connectionstats: {
    find: async (query = {}) => {
      const data = readData();
      return data.connectionstats.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    },
    create: async (doc) => {
      const data = readData();
      const newDoc = {
        _id: generateId(),
        timestamp: new Date().toISOString(),
        status: 'success',
        ...doc
      };
      data.connectionstats.push(newDoc);
      writeData(data);
      return newDoc;
    },
    deleteMany: async (query) => {
      const data = readData();
      const initialCount = data.connectionstats.length;
      data.connectionstats = data.connectionstats.filter(item => {
        for (let key in query) {
          if (item[key] === query[key]) return false;
        }
        return true;
      });
      writeData(data);
      return { deletedCount: initialCount - data.connectionstats.length };
    }
  }
};
