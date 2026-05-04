import React, { useEffect } from 'react';
import Head from 'next/head';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

declare global {
  interface Window {
    __PUBLIC_PATH__?: string;
  }
}

const HoseBuilder = () => {
  useEffect(() => {
    // Lock outer page scroll — PWA manages its own scroll internally
    document.body.style.overflow = 'hidden';

    // PHASE 2: Updated paths
    window.__PUBLIC_PATH__ = publicRuntimeConfig.staticFolder || '/suite360/static/';
    
    const scripts = [
      '/suite360/static/js/453.60f80263.js',
      '/suite360/static/js/main.be4475c2.js'
    ];

    const loadScriptSequentially = async (scripts: string[]) => {
      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.onload = () => {
            console.log(`Script loaded: ${src}`);
            resolve();
          };
          script.onerror = (e) => {
            console.error('Script loading error:', src, e);
            reject(e);
          };
          document.body.appendChild(script);
        });
      }
    };

    loadScriptSequentially(scripts).catch(console.error);

    return () => {
      document.body.style.overflow = '';
      document.querySelectorAll('script[src^="/suite360/"]').forEach(script => {
        script.remove();
      });
    };
  }, []);

  return (
    <>
      <Head>
        <title>Hose360 - Fluid Power Group</title>
        <meta name="description" content="Build your own custom hydraulic hose online. Select hose size, end fittings, cut length and quantity. Done in under 5 minutes. Order direct from FluidPower Group." />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" />
        
        <style>{`
          .hosebuilder-container {
            height: calc(100vh - 100px);
            width: 100%;
            position: relative;
            overflow: hidden;
            margin-top: 100px;
            z-index: 1;
          }

          #root {
            display: flex;
            height: 100%;
            position: relative;
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          @supports (-webkit-overflow-scrolling: touch) {
            .scrollable-content {
              -webkit-overflow-scrolling: touch;
              overflow-y: auto;
            }
          }

          .scroll-view {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            flex: 1;
          }

          .react-native-safe-area-view {
            flex: 1 1 auto;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          .next-button-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
          }

          #fpg-chat-button {
            position: fixed !important;
            bottom: 60px !important;
            right: 20px !important;
            z-index: 10000 !important;
            pointer-events: auto !important;
          }

          #fpg-chat-modal {
            position: fixed !important;
            z-index: 10001 !important;
            pointer-events: auto !important;
          }


        `}</style>
        <link rel="icon" type="image/png" sizes="16x16" href="/suite360/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/suite360/favicon-32.png" />
        <link rel="manifest" href="/suite360/manifest.json" />
      </Head>
      <div className="hosebuilder-container">
        <div id="root"></div>
      </div>
    </>
  );
};

export default HoseBuilder;