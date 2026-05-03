import { motion } from "framer-motion";
import React from "react";
import { FiDownload, FiFileText } from "react-icons/fi";

interface DownloadFile {
  id: string;
  title: string;
  filename: string;
  size: string;
  type: 'pdf';
  category?: string;
}

const downloadFiles: DownloadFile[] = [
  {
    id: "bsp-thread",
    title: "BSP Thread Information Sheet",
    filename: "BSP Thread Information Sheet.pdf",
    size: "238 KB",
    type: "pdf",
  },
  {
    id: "hydraulic-crimp",
    title: "Hydraulic Hose Crimp Chart",
    filename: "Hydraulic Hose Crimp Chart.pdf",
    size: "185 KB",
    type: "pdf",
  },
  {
    id: "jic-thread",
    title: "JIC Thread Information Sheet",
    filename: "JIC Thread Information Sheet.pdf",
    size: "242 KB",
    type: "pdf",
  },
  {
    id: "metric-light",
    title: "METRIC Light Thread Information Sheet",
    filename: "METRIC Light Thread Information Sheet.pdf",
    size: "251 KB",
    type: "pdf",
  },
  {
    id: "orfs-thread",
    title: "ORFS Thread Information Sheet",
    filename: "ORFS Thread Information Sheet.pdf",
    size: "245 KB",
    type: "pdf",
  },
  {
    id: "code61-flange",
    title: "Code 61 Flange - SAE Flange Size Information",
    filename: "code61_help.pdf",
    size: "112 KB",
    type: "pdf",
  },
  {
    id: "code62-flange",
    title: "Code 62 Flange - SAE Flange Size Information",
    filename: "code62_help.pdf",
    size: "113 KB",
    type: "pdf",
  },
];

const DownloadsPage = () => {
  const handleView = (filename: string) => {
    window.open(`/downloads/${filename}`, '_blank');
  };

  const handleDownload = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/downloads/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(250, 204, 21, 0.05) 0%,
            rgba(255, 255, 255, 1) 30%,
            rgba(255, 255, 255, 1) 100%
          )
        `,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 p-8">
          <div className="font-bold text-4xl sm:text-5xl text-yellow-500">
            Downloads
          </div>
          <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
            Technical Documentation & Resources
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloadFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              onClick={() => handleView(file.filename)}
              className="cursor-pointer group relative"
            >
              {/* Glassmorphic Card */}
              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-300 p-6"
                style={{
                  background: `
                    linear-gradient(180deg, 
                      rgba(255, 255, 255, 0.9) 0%, 
                      rgba(255, 255, 255, 0.85) 100%
                    ),
                    rgba(255, 255, 255, 0.8)
                  `,
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                  `,
                  transform: "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(250, 204, 21, 0.5)";
                  e.currentTarget.style.boxShadow = `
                    0 12px 40px rgba(250, 204, 21, 0.2),
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow = `
                    0 8px 32px rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                  `;
                }}
              >
                {/* Download Button - Top Right */}
                <button
                  onClick={(e) => handleDownload(e, file.filename)}
                  className="absolute top-4 right-4 z-10 transition-all duration-300"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(200, 200, 200, 0.3)",
                    color: "#4A4A4A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(250, 204, 21, 0.95)";
                    e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(250, 204, 21, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.borderColor = "rgba(200, 200, 200, 0.3)";
                    e.currentTarget.style.color = "#4A4A4A";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                  }}
                  aria-label="Download file"
                >
                  <FiDownload size={20} />
                </button>

                {/* Content */}
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div
                    className="flex-shrink-0 transition-all duration-300"
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: "rgba(250, 204, 21, 0.15)",
                      border: "1px solid rgba(250, 204, 21, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FACC15",
                    }}
                  >
                    <FiFileText size={28} />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3
                      className="text-lg font-semibold mb-1 pr-12 line-clamp-2"
                      style={{ color: "#4A4A4A" }}
                    >
                      {file.title}
                    </h3>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#999" }}
                    >
                      {file.size}
                    </p>
                  </div>
                </div>

                {/* View Hint - Shows on Hover */}
                <div
                  className="absolute bottom-3 left-40 text-xs font-medium transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{ color: "#FACC15" }}
                >
                  Click to view →
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p
            className="text-sm"
            style={{ color: "#999" }}
          >
            Click any card to view the file in your browser, or use the download button to save locally.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DownloadsPage;