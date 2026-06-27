"use client";
import React from 'react';
import styled from 'styled-components';
import { useTheme } from "@/context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <StyledWrapper>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={theme === "dark"} 
          onChange={toggleTheme} 
        />
        <span className="slider" />
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;

  /* The switch - the box around the slider */
  .switch {
   font-size: 0.85rem;
   position: relative;
   display: inline-block;
   width: 4em;
   height: 2em;
  }

  /* Hide default HTML checkbox */
  .switch input {
   opacity: 0;
   width: 0;
   height: 0;
  }

  /* The slider */
  .slider {
   position: absolute;
   cursor: pointer;
   inset: 0;
   background-color: var(--bg-secondary);
   transition: 0.4s;
   border-radius: 0.5em;
   border: 1px solid var(--border);
   box-shadow: 0 0.15em var(--border);
  }

  .slider:before {
   position: absolute;
   content: "";
   height: 1.3em;
   width: 1.3em;
   border-radius: 0.3em;
   left: 0.3em;
   bottom: 0.5em;
   background-color: #000000;
   transition: 0.4s;
   box-shadow: 0 0.3em rgba(0, 0, 0, 0.15);
  }

  [data-theme="dark"] .slider {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0.15em rgba(255, 255, 255, 0.05);
  }

  [data-theme="dark"] .slider:before {
    background-color: #FF3D16;
    box-shadow: 0 0.3em rgba(255, 61, 22, 0.3);
  }

  .slider:hover::before {
   bottom: 0.4em;
   box-shadow: 0 0.15em rgba(0, 0, 0, 0.15);
  }

  [data-theme="dark"] .slider:hover::before {
    box-shadow: 0 0.15em rgba(255, 61, 22, 0.3);
  }

  input:checked+.slider:before {
   transform: translateX(2em);
  }
`;

export default ThemeToggle;
