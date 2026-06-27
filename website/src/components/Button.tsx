"use client";
import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  id?: string;
  href?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, type = "button", id, href, fullWidth = false }) => {
  if (href) {
    return (
      <StyledWrapper $fullWidth={fullWidth}>
        <a href={href} className="animated-button" id={id} onClick={onClick}>
          <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
          </svg>
          <span className="text">{children}</span>
          <span className="circle" />
          <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
          </svg>
        </a>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper $fullWidth={fullWidth}>
      <button className="animated-button" type={type} id={id} onClick={onClick}>
        <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
        <span className="text">{children}</span>
        <span className="circle" />
        <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $fullWidth?: boolean }>`
  display: ${props => props.$fullWidth ? 'block' : 'inline-block'};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  .animated-button {
    position: relative;
    display: ${props => props.$fullWidth ? 'flex' : 'inline-flex'};
    justify-content: ${props => props.$fullWidth ? 'center' : 'flex-start'};
    align-items: center;
    width: ${props => props.$fullWidth ? '100%' : 'auto'};
    gap: 4px;
    padding: 12px 32px;
    border: 2px solid transparent;
    font-size: 14px;
    font-family: 'Space Grotesk', sans-serif;
    background-color: inherit;
    border-radius: 100px;
    font-weight: 600;
    color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
    cursor: pointer;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    text-decoration: none;
    line-height: 1.2;
    box-sizing: border-box;
  }

  .animated-button svg {
    position: absolute;
    width: 18px;
    height: 18px;
    fill: var(--accent);
    z-index: 9;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button .arr-1 {
    right: 14px;
  }

  .animated-button .arr-2 {
    left: -25%;
  }

  .animated-button .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background-color: var(--accent);
    border-radius: 50%;
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .animated-button .text {
    position: relative;
    z-index: 1;
    transform: translateX(-8px);
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    color: var(--text-primary);
  }

  .animated-button:hover .text {
    color: var(--bg);
  }

  .animated-button:hover {
    box-shadow: 0 0 0 12px transparent;
    border-radius: 100px;
  }

  .animated-button:hover .arr-1 {
    right: -25%;
  }

  .animated-button:hover .arr-2 {
    left: 14px;
  }

  .animated-button:hover .text {
    transform: translateX(8px);
  }

  .animated-button:hover svg {
    fill: var(--bg);
  }

  .animated-button:active {
    scale: 0.96;
    box-shadow: 0 0 0 4px var(--accent);
  }

  .animated-button:hover .circle {
    width: 260px;
    height: 260px;
    opacity: 1;
  }
`;

export default Button;
