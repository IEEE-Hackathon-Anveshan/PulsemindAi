import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Laugh, TrendingUp, Heart, AlertCircle } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const LaughingTherapy: React.FC = () => {
  const location = useLocation();
  const [therapyContext, setTherapyContext] = useState<any>(null);
  const [slideIndex, setSlideIndex] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    AOS.init();
    
    // Get therapy context from navigation state or localStorage
    const contextFromState = location.state;
    const contextFromStorage = localStorage.getItem('current_therapy_context');
    
    if (contextFromState) {
      setTherapyContext(contextFromState);
    } else if (contextFromStorage) {
      try {
        setTherapyContext(JSON.parse(contextFromStorage));
      } catch (error) {
        console.error('Error parsing therapy context:', error);
      }
    }
    
    // Track therapy adoption
    trackTherapyAdoption();
  }, [location]);
  
  const trackTherapyAdoption = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:5000/api/user/track-engagement', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'therapy_adoption' })
        });
      }
    } catch (error) {
      console.error('Error tracking therapy:', error);
    }
  };

  const showSlides = (n: number) => {
    const slides = document.getElementsByClassName("mySlides");
    if (n > slides.length) setSlideIndex(1);
    if (n < 1) setSlideIndex(slides.length);
    for (let i = 0; i < slides.length; i++) {
      (slides[i] as HTMLElement).style.display = "none";
    }
    (slides[slideIndex - 1] as HTMLElement).style.display = "block";
  };

  useEffect(() => {
    showSlides(slideIndex);
  }, [slideIndex]);

  const plusSlides = (n: number) => {
    setSlideIndex(prev => prev + n);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <header className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/src/imgs/laugh.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center text-white px-4">
          <div className="max-w-4xl">
            <h1 data-aos="fade-down" className="text-5xl md:text-6xl font-bold text-white mb-6">
              Welcome to Our <br />
              <span className="text-yellow-500">Laughing Therapy</span>
            </h1>
            <h3 data-aos="fade-up-right" data-aos-duration="1500" className="text-xl text-white/90">
              Read some memes and <br />
              enjoy watching standup to gain some happiness and relief <br />
              from your problems.
            </h3>
          </div>
        </div>
      </header>

      {/* Personalized Context Section */}
      {therapyContext && (
        <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="max-w-6xl mx-auto">
            {/* Assessment Summary Card */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-pink-500/20 rounded-2xl p-8 border border-yellow-500/30 mb-8" data-aos="fade-up">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-8 h-8 text-stress-yellow" />
                <h2 className="text-3xl font-bold text-white">Your Personalized Laughter Journey</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Wellness Score */}
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h3 className="text-white/80 font-semibold">Wellness Score</h3>
                  </div>
                  <p className="text-4xl font-bold text-stress-yellow">{therapyContext.score}%</p>
                  <p className="text-white/60 text-sm mt-2">
                    {therapyContext.score >= 70 ? 'Great progress!' : 
                     therapyContext.score >= 40 ? 'Keep going!' : 
                     'We\'re here to help'}
                  </p>
                </div>

                {/* Mood Summary */}
                <div className="md:col-span-2 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white/80 font-semibold">Your Current State</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed">{therapyContext.moodSummary}</p>
                </div>
              </div>

              {/* Why Laughing Therapy */}
              {therapyContext.reasoning && (
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Laugh className="w-5 h-5 text-stress-yellow" />
                    <h3 className="text-white font-semibold">Why Laughing Therapy?</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">{therapyContext.reasoning}</p>
                </div>
              )}
            </div>

            {/* Personalized Comedy Recommendations */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Laugh className="w-6 h-6 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">Recommended Comedy Content</h3>
              </div>
              <p className="text-white/70 mb-6">
                Based on your mood, here's what will make you smile:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {therapyContext.score < 40 ? (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Wholesome Memes</h4>
                      <p className="text-white/60 text-sm">Light-hearted content to gently lift your spirits</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Feel-Good Comedy</h4>
                      <p className="text-white/60 text-sm">Comforting humor that brings warmth</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Uplifting Stand-Up</h4>
                      <p className="text-white/60 text-sm">Positive stories and gentle laughter</p>
                    </div>
                  </>
                ) : therapyContext.score < 70 ? (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Relatable Memes</h4>
                      <p className="text-white/60 text-sm">Everyday humor you can connect with</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Comedy Specials</h4>
                      <p className="text-white/60 text-sm">Popular stand-up to boost your mood</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Funny Sketches</h4>
                      <p className="text-white/60 text-sm">Quick laughs from comedy shows</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Trending Memes</h4>
                      <p className="text-white/60 text-sm">Latest internet humor to keep you laughing</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Bold Stand-Up</h4>
                      <p className="text-white/60 text-sm">Edgy comedy to match your great mood</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Comedy Roasts</h4>
                      <p className="text-white/60 text-sm">High-energy humor for maximum fun</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <h1 data-aos="flip-right" className="text-4xl font-bold text-center text-white mb-12">
          ABOUT
        </h1>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-up-right" data-aos-duration="5000" className="image">
            <img src="/src/imgs/laugh2.jpg" alt="Laughing Therapy" className="rounded-2xl shadow-xl" />
          </div>
          <div className="about-content">
            <h4 data-aos="fade-up-left" className="text-2xl font-semibold text-yellow-500 mb-6">
              Laughter Yoga includes four things:
            </h4>
            <ol className="space-y-4 text-white/90">
              <li data-aos="fade-left">Clapping in rhythm to 'ho-ho-ha-ha-ha'.</li>
              <li data-aos="fade-left">Breathing and stretching.</li>
              <li data-aos="fade-left">Child-like play.</li>
              <li data-aos="fade-left">Laughter exercises.</li>
            </ol>
            <a 
              href="https://www.healthline.com/nutrition/laughing-yoga" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-yellow-500 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 transition-all"
            >
              Know More
            </a>
          </div>
        </div>
      </section>

      {/* Memes Section */}
      <section id="memes" className="py-20 px-4">
        <h1 data-aos="zoom-out" className="text-4xl font-bold text-center text-white mb-12">
          MEMES
        </h1>
        <div data-aos="flip-up" className="max-w-4xl mx-auto relative">
          <div className="mySlides fade">
            <img src="/src/imgs/meme1.jpg" alt="Meme 1" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>
          <div className="mySlides fade">
            <img src="/src/imgs/meme2.jpg" alt="Meme 2" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>
          <div className="mySlides fade">
            <img src="/src/imgs/meme3.jpg" alt="Meme 3" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>
          <div className="mySlides fade">
            <img src="/src/imgs/meme4.jpg" alt="Meme 4" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>
          <div className="mySlides fade">
            <img src="/src/imgs/meme5.jpg" alt="Meme 5" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>
          <div className="mySlides fade">
            <img src="/src/imgs/meme6.jpg" alt="Meme 6" className="w-1/2 mx-auto rounded-lg shadow-xl" />
          </div>

          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
            onClick={() => plusSlides(-1)}
          >
            ❮
          </button>
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
            onClick={() => plusSlides(1)}
          >
            ❯
          </button>
        </div>
      </section>

      {/* Standups Section */}
      <section id="standups" className="py-20 px-4">
        <h1 data-aos="zoom-in-up" className="text-4xl font-bold text-center text-white mb-12">
          STANDUPS
        </h1>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            "Tqsz6fjvhZM", "Y2Oj9gllHno", "XDlyS4N__3o", "z12bz7adLKI",
            "pjSxOnCkHIA", "J38ZBIvLank", "dtaJzUbQS7E", "8PtsKRBgLrA",
            "cHLM9L_5gj0", "injU8xUHoyU", "KKnhgkmV7k8", "_9x9zagDbks",
            "L9pA6sZZjeY", "MLOp3iQFlXY", "AhacYw9dkyE", "qkxuFKqJXWY"
          ].map((videoId, index) => (
            <div key={videoId} data-aos="flip-down" className="video">
              <iframe
                width="100%"
                height="330"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-xl"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LaughingTherapy; 