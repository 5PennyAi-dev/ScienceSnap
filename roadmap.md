# 🚀 ScienceSnap Development Roadmap

Our mission is to make science accessible, beautiful, and fun. This roadmap outlines the future of ScienceSnap, moving from static image generation to a fully immersive educational platform.

---

## 🎨 Phase 1: Visual Mastery & Customization
*Focus: Giving users total control over the aesthetic output.*

### **1. Artistic Style Selector**
Implement a specific style picker separate from the "Audience" toggle.
- **Options:** Pixel Art, 3D Claymation, Cyberpunk, Watercolor, Origami/Paper Cutout, Vintage Textbook, Neon Minimalist.
- **Implementation:** Inject style tokens into the Gemini image prompt generation pipeline.

### **2. Color Palette Generator**
Allow users to enforce color schemes on the infographics to match school colors or personal preference.
- **Features:** "Space Dark", "Ocean Blue", "Forest Green", "Pastel Pop".

### **3. "Remix" Feature**
Button to keep the *content* (text/fact) but completely regenerate the *visuals* with a new random style.

### **4. Poster Export Mode**
Add a dedicated export format optimized for printing.
- **Features:** A4/Letter size support, CMYK color profile adjustment (if supported), and high-resolution upscaling.

---

## 🧠 Phase 2: Interactive Learning & Multimedia
*Focus: Leveraging multimodal capabilities (Audio/Video) to enhance learning.*

### **5. Audio Narrations (Gemini Audio)**
Add a "Listen" button to every card.
- **Feature:** Uses Gemini's TTS capabilities to read the fact aloud.
- **Variations:** "Professor Voice" for adults, "Excited Explorer" for kids.

### **6. "Quiz Me" Mode**
Turn the gallery into a game.
- **Feature:** Generate a 3-question quiz based *only* on the visual information and text in a saved infographic.
- **Reward:** Earn "Science Badges" (e.g., "Biologist", "Astronomer") for correct answers.

### **7. Video/Motion Infographics (Veo Integration)**
Upgrade static images to short loops.
- **Feature:** Use Google Veo to animate the background (e.g., flowing water in a biology card, swirling stars in astronomy).
- **Output:** Export as GIF or MP4 for social media (TikTok/Reels).

---

## 🏫 Phase 3: Classroom & Community
*Focus: Tools for teachers and collaborative learning.*

### **8. Teacher Dashboard / Classroom Mode**
- **Features:** 
    - Create a "Class Code" to group student submissions.
    - "Projector View" to display a slideshow of the class's creations.
    - PDF export of a "Class Science Book".

### **9. Community "Fact of the Day" Challenge**
- **Feature:** A global daily theme (e.g., "Mars", "Deep Sea") where users submit their generations to a public leaderboard.

### **10. Deep Dive Chat**
- **Feature:** Click a "Ask a Question" button on any infographic to open a chat window specifically context-aware of that specific fact, allowing the user to ask follow-up questions.

---

## 🧪 Phase 4: The "Future Lab" (Experimental)
*Focus: Bleeding-edge AI features.*

### **11. AR (Augmented Reality) Viewer**
- **Feature:** Allow users to project 3D representations of their facts (e.g., a molecule or a planet) into their room using the phone camera.

### **12. Voice-First Mode (Gemini Live)**
- **Feature:** A hands-free mode where a child can ask "Tell me a weird fact about bugs" and the app speaks the answer while generating the image in real-time background.

### **13. Multi-Panel Comic Strips**
- **Feature:** Instead of one single image, generate a 3-panel comic strip explaining a scientific process (e.g., The Water Cycle).

---

## 🛠 Technical Improvements
- **PWA (Progressive Web App):** Full offline support for viewing the gallery.
- **User Authentication:** Sync gallery across devices.
- **Performance:** Caching generated images to reduce API costs.
