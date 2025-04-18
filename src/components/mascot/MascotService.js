// src/components/mascot/MascotService.js
class MascotService {
    constructor() {
      this.messageTypes = {
        timeReminder: [
          "You've got {time} left. How will you use it?",
          "Only {time} remaining! Better use it wisely.",
          "Tick tock! {time} on the clock!"
        ],
        quizSuccess: [
          "Great job! You earned {time} more app time!",
          "Smarty pants! Here's {time} for your brilliance!",
          "Correct! Enjoy your well-earned {time}!"
        ],
        milestone: [
          "You're on fire! {streak} correct answers in a row!",
          "What a streak! {streak} correct answers! Keep going!",
          "Amazing streak of {streak}! You're unstoppable!"
        ],
        timeExpired: [
          "Oops! Your time is up. Answer some questions to earn more!",
          "Time's up! Ready to learn something new?",
          "No more time left. Let's earn some more!"
        ]
      };
    }
    
    // Get a random message by type, with replacements
    getMessage(type, replacements = {}) {
      const messages = this.messageTypes[type] || this.messageTypes.timeReminder;
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Replace placeholders with actual values
      return message.replace(/{(\w+)}/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
      });
    }
    
    // Get mascot mood based on situation
    getMascotMood(context) {
      if (context.timeExpired) return 'sad';
      if (context.isCorrectAnswer) return 'excited';
      if (context.streak >= 3) return 'excited';
      if (context.timeRemaining < 60) return 'concerned';
      return 'happy';
    }
  }
  
  export default new MascotService();