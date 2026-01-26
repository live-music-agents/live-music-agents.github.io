import React from 'react';
import designspaceImage from '../assets/designspace.png';
import { PAPER_URL } from '../constants';

const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-transparent overflow-auto">
      <div className="w-full">
        <a
          href={PAPER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <h1 className="text-4xl font-bold text-gray-100 font-['Flama'] mb-6 hover:text-white transition-colors">
            A Design Space for Live Music Agents
          </h1>
        </a>
        <h4 className="text-lg text-gray-300 mb-2"> Yewon Kim, Stephen Brade, Alexander Wang, David Zhou, Haven Kim, Bill Wang, Sung-Ju Lee, Hugo F Flores Garcia, Anna Huang, Chris Donahue </h4>
        <h4 className="text-lg text-gray-300 mb-8"> Published at CHI 2026 </h4>
        
        <div className="bg-gray-800/50 rounded-lg shadow-sm">
          <section>
            <div className="mt-6">
              <img
                src={designspaceImage}
                alt="Design space overview"
                className="w-full rounded-lg shadow-sm"
              />
            </div>
            <p className="text-gray-300 leading-relaxed text-lg mt-4">
              Live music agents--intelligent systems that listen and respond to musicians in real time--sit at the intersection of Human-Computer Interaction (HCI), Artificial Intelligence (AI), and Computer Music. Despite decades of research, these communities have developed largely in parallel, making it difficult to compare systems, identify gaps, and envision new directions.

              To address this, we analyzed 184 systems from academic literature and online videos and created a comprehensive design space organized around four key aspects:
              
              <ul className="list-disc pl-6 space-y-2 mt-2 mb-4">
                <li>
                  <strong style={{ color: '#686AA4' }}>Usage Context:</strong> When and where are live music agents used?
                </li>
                <li>
                  <strong style={{ color: '#BB769A' }}>Interaction:</strong> How do live music agents interact with human musicians?
                </li>
                <li>
                  <strong style={{ color: '#618EB4' }}>Technology:</strong> What computational models and infrastructure power these systems?
                </li>
                <li>
                  <strong style={{ color: '#357761' }}>Ecosystem:</strong> What are the broader societal, economic, and cultural implications?
                </li>
              </ul>

              We hope this design space provides researchers, designers, and musicians with a structured framework for understanding existing systems and imagining new forms of live music agents.
              For full details, please refer to our <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="highlight-link">paper</a>.
            </p>
            
            <div className="mt-6 text-gray-300 space-y-3 text-lg">
              <h3 className="text-xl font-semibold text-gray-200">Contribute</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Add your paper/system: Complete <a href="https://docs.google.com/forms/d/e/1FAIpQLSdsJ8EVET8af8LkLAAhbOpM385IupkmNEQr7pAskKkMm1asSA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="highlight-link">this form</a> to include your live music agent in our dataset.
                </li>
                <li>
                  Report issues or corrections: Email Yewon Kim at <a href="mailto:yewon@cmu.edu" className="highlight-link">yewon@cmu.edu</a>.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
