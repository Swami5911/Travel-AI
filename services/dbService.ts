
import { User, VisitorUser, GuideUser, AdminUser, UserRole, Review, Itinerary } from '../types';

const DB_KEY = 'travel_ai_db_v1';

interface DatabaseSchema {
  users: User[];
  chats: Record<string, any[]>; // guideId -> messages
}

// Initial seed data
const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'admin-1',
      name: 'Admin User',
      role: 'admin',
      password: 'admin123', // Simple mock password
    },
    {
        id: 'guide-1',
        name: 'Rahul Sharma',
        role: 'guide',
        password: 'password',
        specialties: ['History', 'Culture'],
        bio: 'Expert in Rajasthan history with 10 years experience.',
        image: 'https://ui-avatars.com/api/?name=Rahul+Sharma',
        isAvailable: true,
        reviews: [],
        rating: 5,
    } as GuideUser
  ],
  chats: {}
};

// Helper to simulate async DB calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class Database {
  private data: DatabaseSchema;

  constructor() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = INITIAL_DATA;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  async login(name: string, password?: string): Promise<User | null> {
    await delay(300);
    // Rough "login" by name for simplicity if password omitted, or full check
    const user = this.data.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (user) {
        if (password && user.password !== password) return null;
        return user;
    }
    return null;
  }

  async registerVisitor(name: string): Promise<VisitorUser> {
    await delay(300);
    const newUser: VisitorUser = {
      id: `visitor-${Date.now()}`,
      name,
      role: 'visitor',
      password: 'password', // Default
      history: []
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  async registerGuide(name: string, bio: string, specialties: string[]): Promise<GuideUser> {
    await delay(300);
    const newUser: GuideUser = {
      id: `guide-${Date.now()}`,
      name,
      role: 'guide',
      password: 'password',
      bio,
      specialties,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
      isAvailable: true,
      reviews: [],
      rating: 0
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  async getAllGuides(): Promise<GuideUser[]> {
      await delay(200);
      return this.data.users.filter(u => u.role === 'guide') as GuideUser[];
  }

  async getAllVisitors(): Promise<VisitorUser[]> {
      await delay(200);
      return this.data.users.filter(u => u.role === 'visitor') as VisitorUser[];
  }

  async updateGuideStatus(guideId: string, isAvailable: boolean): Promise<boolean> {
      const guide = this.data.users.find(u => u.id === guideId) as GuideUser;
      if (guide && guide.role === 'guide') {
          guide.isAvailable = isAvailable;
          this.save();
          return true;
      }
      return false;
  }

  async updateGuideProfile(guideId: string, updates: Partial<GuideUser>): Promise<GuideUser | null> {
      await delay(400);
      const guideIndex = this.data.users.findIndex(u => u.id === guideId);
      if (guideIndex > -1 && this.data.users[guideIndex].role === 'guide') {
          const updatedGuide = { ...this.data.users[guideIndex], ...updates } as GuideUser;
          this.data.users[guideIndex] = updatedGuide;
          this.save();
          return updatedGuide;
      }
      return null;
  }

  async addItineraryToHistory(userId: string, itinerary: Itinerary): Promise<VisitorUser | null> {
      await delay(300);
      const userIndex = this.data.users.findIndex(u => u.id === userId);
      if (userIndex > -1 && this.data.users[userIndex].role === 'visitor') {
          const user = this.data.users[userIndex] as VisitorUser;
          // Avoid duplicates or simple append
          user.history.unshift(itinerary); 
          this.save();
          return user;
      }
      return null;
  }

  async deleteUser(userId: string): Promise<boolean> {
      await delay(300);
      const initialLength = this.data.users.length;
      this.data.users = this.data.users.filter(u => u.id !== userId);
      if (this.data.users.length < initialLength) {
          this.save();
          return true;
      }
      return false;
  }
}

export const db = new Database();
