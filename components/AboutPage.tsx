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
        
        <div className="bg-gray-800/50 rounded-lg shadow-sm border border-gray-700">
          <section>
            <p className="text-gray-300 leading-relaxed text-lg">
              Welcome to our design space for live music agents!
              (briefly explain about the overview) - like map HCI, AI, Computer Music,..
              We hope our design space offers researchers, designers, and musicians a practical tool to navigate, comprehend, and ... the various possibilities of live music agents, 
              and aid in the envisioning and design of new live music agents. For more details refer to our{' '}
              <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">paper</a>.
            </p>
            <div className="mt-6">
              <img
                src={designspaceImage}
                alt="Design space overview"
                className="w-full rounded-lg border border-gray-700 shadow-sm"
              />
            </div>
            <div className="mt-6 text-gray-300 space-y-3 text-lg">
              <p>
                We encourage contributions from the community. This is a living artifact—please
                contribute and help us keep it current.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  If you want to add your paper or live music agents to the list, please complete the
                  form: <a href="<link>" className="text-indigo-400 hover:text-indigo-300 underline">&lt;link&gt;</a>
                </li>
                <li>
                  Have questions or found incorrect annotation: <a href="mailto:" className="text-indigo-400 hover:text-indigo-300 underline">email Yewon</a>
                </li>
                <li>
                  More details: <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">read paper</a>
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
