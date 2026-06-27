"use client";

import React, { useState } from "react";
import styled from "styled-components";

interface DownloadButtonProps {
  apkUrl?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  apkUrl =
  "https://drive.google.com/drive/folders/1K2cCD0wOt78IsLl6jG8QLlnnka1s7nH1",
}) => {
  const [status, setStatus] = useState<"idle" | "installing" | "installed">(
    "idle"
  );

  const handleDownload = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "idle") return;

    setStatus("installing");

    // Opens Google Drive folder in a new tab
    window.open(apkUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      setStatus("installed");
    }, 3500);
  };

  return (
    <StyledWrapper $status={status}>
      <div className="btn-container">
        <button
          type="button"
          className="label"
          onClick={handleDownload}
          disabled={status !== "idle"}
        >
          <span className="circle">
            <svg
              className="icon"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 19V5m0 14-4-4m4 4 4-4"
              />
            </svg>
            <div className="square" />
          </span>

          <span className="title title-download">Download APK</span>
          <span className="title title-installed">Ready</span>
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $status: 'idle' | 'installing' | 'installed' }>`
  .btn-container {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .label {
    background-color: transparent;
    border: 2px solid var(--accent);
    display: flex;
    align-items: center;
    border-radius: 50px;
    width: ${props => props.$status === 'idle' ? '170px' : props.$status === 'installing' ? '52px' : '150px'};
    height: 52px;
    cursor: ${props => props.$status === 'idle' ? 'pointer' : 'default'};
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 4px;
    position: relative;
    box-sizing: border-box;
    outline: none;
  }

  .label::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--bg);
    width: 6px;
    height: 6px;
    transition: all 0.4s ease;
    border-radius: 100%;
    margin: auto;
    opacity: 0;
    visibility: hidden;
    ${props => props.$status === 'installing' && `
      animation: rotate 3s ease-in-out 0.4s forwards;
    `}
  }

  .label .title {
    font-size: 15px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    color: var(--text-primary);
    transition: all 0.4s ease;
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    text-align: center;
    margin: 0;
  }

  .title-download {
    opacity: ${props => props.$status === 'idle' ? '1' : '0'};
    visibility: ${props => props.$status === 'idle' ? 'visible' : 'hidden'};
  }

  .title-installed {
    opacity: ${props => props.$status === 'installed' ? '1' : '0'};
    visibility: ${props => props.$status === 'installed' ? 'visible' : 'hidden'};
    right: ${props => props.$status === 'installed' ? '36px' : '18px'};
  }

  .label .circle {
    height: 40px;
    width: 40px;
    border-radius: 50%;
    background-color: var(--accent);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.4s ease;
    position: relative;
    box-shadow: 0 0 0 0 var(--bg);
    overflow: hidden;
    transform: ${props => props.$status !== 'idle' ? 'rotate(180deg)' : 'rotate(0deg)'};
    ${props => props.$status === 'installing' && `
      animation: pulse 1s infinite;
    `}
    ${props => props.$status === 'installed' && `
      opacity: 0;
      visibility: hidden;
    `}
  }

  .label .circle .icon {
    color: var(--bg);
    width: 20px;
    height: 20px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
    z-index: 2;
    opacity: ${props => props.$status === 'idle' ? '1' : '0'};
    visibility: ${props => props.$status === 'idle' ? 'visible' : 'hidden'};
  }

  .label .circle .square {
    aspect-ratio: 1;
    width: 12px;
    border-radius: 2px;
    background-color: var(--bg);
    opacity: ${props => props.$status === 'installing' ? '1' : '0'};
    visibility: ${props => props.$status === 'installing' ? 'visible' : 'hidden'};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
    z-index: 3;
  }

  .label .circle::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    background-color: rgba(255, 255, 255, 0.4);
    width: 100%;
    height: 0;
    z-index: 1;
    ${props => props.$status === 'installing' && `
      animation: installing 3s ease-in-out forwards;
    `}
  }

  /* Custom Green Border on Complete */
  ${props => props.$status === 'installed' && `
    border-color: #22c55e !important;
  `}

  @keyframes pulse {
    0% {
      scale: 0.95;
      box-shadow: 0 0 0 0 var(--accent-border);
    }
    70% {
      scale: 1;
      box-shadow: 0 0 0 12px rgba(255, 255, 255, 0);
    }
    100% {
      scale: 0.95;
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  @keyframes installing {
    from {
      height: 0;
    }
    to {
      height: 100%;
    }
  }

  @keyframes rotate {
    0% {
      transform: rotate(-90deg) translate(22px) rotate(0);
      opacity: 1;
      visibility: visible;
    }
    99% {
      transform: rotate(270deg) translate(22px) rotate(270deg);
      opacity: 1;
      visibility: visible;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }
`;

export default DownloadButton;