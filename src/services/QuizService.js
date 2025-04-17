// src/services/QuizService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class QuizService {
  constructor() {
    this.baseUrl = 'https://brain-bites-api.onrender.com'; // Replace with your actual API URL
    this.usedQuestionIds = new Set();
    this.STORAGE_KEY = 'brainbites_quiz_data';
    this.loadSavedData();
  }
  
  // Load previously saved quiz data from storage
  async loadSavedData() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.usedQuestionIds = new Set(parsedData.usedQuestionIds || []);
      }
    } catch (error) {
      console.error('Error loading saved quiz data:', error);
    }
  }
  
  // Save quiz data to storage
  async saveData() {
    try {
      const data = {
        usedQuestionIds: Array.from(this.usedQuestionIds),
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving quiz data:', error);
    }
  }
  
  // Get a random question from the API
  async getRandomQuestion(category = 'funfacts') {
    try {
      let apiUrl = `${this.baseUrl}/api/questions/random`;
      
      // Add category if specified
      if (category) {
        apiUrl = `${this.baseUrl}/api/questions/random/${category}`;
      }
      
      console.log(`Fetching question from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const question = await response.json();
      
      // Check if this question has been used recently
      if (this.usedQuestionIds.has(question.id)) {
        // If we have too many used questions, reset the list
        if (this.usedQuestionIds.size > 30) {
          this.usedQuestionIds.clear();
        } else {
          // Try again to get a different question
          return this.getRandomQuestion(category);
        }
      }
      
      // Mark this question as used
      this.usedQuestionIds.add(question.id);
      await this.saveData();
      
      return question;
    } catch (error) {
      console.error('Error fetching question:', error);
      
      // Fallback to a simple question if API is unavailable
      return {
        id: Math.floor(Math.random() * 1000),
        question: "What is 2 + 2?",
        options: {
          A: "3",
          B: "4",
          C: "5",
          D: "6"
        },
        correctAnswer: "B",
        explanation: "2 + 2 = 4. This is a basic addition fact."
      };
    }
  }
  
  // Get available categories
  async getCategories() {
    try {
      // You might want to add an endpoint to your API that returns categories
      // For now, we'll hardcode the categories from your existing web app
      return ['funfacts', 'psychology'];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['funfacts', 'psychology'];
    }
  }
  
  // Clear used questions tracking
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveData();
  }
}

export default new QuizService();
