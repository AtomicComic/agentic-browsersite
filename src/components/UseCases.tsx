
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const useCases = [
  {
    title: "Task Automation",
    description: "Automate form filling, data entry, and repetitive tasks with a simple command.",
    image: "/lovable-uploads/3362b8b6-05a6-4f19-9ea9-680117331421.png"
  },
  {
    title: "Content Summarization",
    description: "Get instant summaries of articles, research papers, or any webpage with one click.",
    image: "/lovable-uploads/3362b8b6-05a6-4f19-9ea9-680117331421.png"
  },
  {
    title: "Image Analysis",
    description: "Extract text from images, analyze visual content, and generate descriptions automatically.",
    image: "/lovable-uploads/3362b8b6-05a6-4f19-9ea9-680117331421.png"
  },
  {
    title: "Research Assistant",
    description: "Research topics efficiently with AI finding and highlighting key information on websites.",
    image: "/lovable-uploads/3362b8b6-05a6-4f19-9ea9-680117331421.png"
  }
];

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 bg-agentic-dark/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h6 className="text-agentic-blue font-medium mb-3">APPLICATIONS</h6>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Use Cases</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Discover how Agentic Browser can enhance your productivity and transform your browsing experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <Card key={index} className="bg-transparent border border-white/10 overflow-hidden hover-glow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 bg-gradient-to-br from-agentic-purple/20 to-agentic-blue/20 p-6 flex items-center justify-center">
                  <div className="aspect-square w-full max-w-[180px] rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-5xl text-agentic-purple">{index + 1}</span>
                  </div>
                </div>
                <CardContent className="md:w-3/5 p-6">
                  <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                  <p className="text-white/70">{useCase.description}</p>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
