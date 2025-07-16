import React from "react";

const Dashboard: React.FC = () => (
  <div>
    <div className="flex flex-wrap justify-between gap-3 p-4">
      <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight min-w-72">Dashboard</p>
    </div>
    <div className="flex flex-wrap gap-4 p-4">
      <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#cedbe8]">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Documents Uploaded</p>
        <p className="text-[#0d141c] tracking-light text-2xl font-bold leading-tight">125</p>
      </div>
      <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#cedbe8]">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Processing Status</p>
        <p className="text-[#0d141c] tracking-light text-2xl font-bold leading-tight">Completed</p>
      </div>
      <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#cedbe8]">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Recent Queries</p>
        <p className="text-[#0d141c] tracking-light text-2xl font-bold leading-tight">50</p>
      </div>
    </div>
    <h2 className="text-[#0d141c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Recent Activities</h2>
    <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
      <div className="flex flex-col items-center gap-1 pt-3">
        <div className="text-[#0d141c]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
          </svg>
        </div>
        <div className="w-[1.5px] bg-[#cedbe8] h-2 grow"></div>
      </div>
      <div className="flex flex-1 flex-col py-3">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Uploaded 'Employee Handbook'</p>
        <p className="text-[#49739c] text-base font-normal leading-normal">2 hours ago</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="w-[1.5px] bg-[#cedbe8] h-2"></div>
        <div className="text-[#0d141c]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z" />
          </svg>
        </div>
        <div className="w-[1.5px] bg-[#cedbe8] h-2 grow"></div>
      </div>
      <div className="flex flex-1 flex-col py-3">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Chat with AI about 'Benefits'</p>
        <p className="text-[#49739c] text-base font-normal leading-normal">4 hours ago</p>
      </div>
      <div className="flex flex-col items-center gap-1 pb-3">
        <div className="w-[1.5px] bg-[#cedbe8] h-2"></div>
        <div className="text-[#0d141c]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
          </svg>
        </div>
      </div>
      <div className="flex flex-1 flex-col py-3">
        <p className="text-[#0d141c] text-base font-medium leading-normal">Uploaded 'Q3 Financial Report'</p>
        <p className="text-[#49739c] text-base font-normal leading-normal">1 day ago</p>
      </div>
    </div>
    <div className="flex justify-stretch">
      <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em]">
          <span className="truncate">Upload Document</span>
        </button>
        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#e7edf4] text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em]">
          <span className="truncate">Start Chat</span>
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard; 