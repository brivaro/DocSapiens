import React from "react";

const Navbar: React.FC = () => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf4] px-10 py-3 bg-slate-50">
    <div className="flex items-center gap-4 text-[#0d141c]">
      <div className="size-4">
        {/* Logo SVG */}
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" />
        </svg>
      </div>
      <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em]">DocSapiens</h2>
    </div>
    <div className="flex flex-1 justify-end gap-8">
      <div className="flex items-center gap-9">
        <a className="text-[#0d141c] text-sm font-medium leading-normal" href="/dashboard">Dashboard</a>
        <a className="text-[#0d141c] text-sm font-medium leading-normal" href="/documents">Documents</a>
        <a className="text-[#0d141c] text-sm font-medium leading-normal" href="/chat">Chat</a>
        <a className="text-[#0d141c] text-sm font-medium leading-normal" href="/settings">Settings</a>
      </div>
      <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-[#e7edf4] text-[#0d141c] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
        <span>Ayuda</span>
      </button>
      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxOzmO8Xx5B4BwpH7PsYh6GgkLDqi9__Of4B3ZQPEnoDRwCt-tf2MdAy87JeTzYC3Y-UPxlDdrq5XrXPrqwcmf6vfZP8kKt-rebLqI4A2E95r_utwgyOdBzuf1AKV-HWAM4ppPSvVXe4HdMV20wULd4tjk3ouKOj_D0RK7Mxx47FFF3_g1tirbbxLS96jPtFUM48Fl5NTrLCPYZyPJKR_AKZRRV5yBtwLaG_po_iIvZu-Kkko8uOCu9yNdpHK22VwGAeHlsDw0XDW4')`}}></div>
    </div>
  </header>
);

export default Navbar; 