import { useEffect, useState } from "react";
import { BsArrowLeftShort, BsList, BsGear, BsBoxArrowRight } from "react-icons/bs";
import { MdDashboard, MdReport } from "react-icons/md";
import { Outlet, Link } from "react-router-dom";
import { axiosClient } from "../Api/axios";
import { useNavigate } from "react-router-dom";
import { FaArchive } from "react-icons/fa";

const Layout = () => {
  const loginNav = useNavigate()
  const [open, setOpen] = useState(false);

  useEffect(()=>{
  
    if(!window.localStorage.getItem('ACCESS_TOKEN')){
          loginNav("/login")
    }

  },[loginNav])


  const logOut = () =>{
    axiosClient.post('/logout')
    window.localStorage.removeItem("ACCESS_TOKEN")
    loginNav('/login')
  }

  return (
    <div className="flex h-screen">
      
      <div
        className={`bg-blue-700 h-full p-5 pt-8 ${
          open ? "w-55" : "w-20"
        } duration-300 relative transition-all`}
      >
        
        <BsArrowLeftShort
          className={`bg-white text-blue-900 text-3xl rounded-full 
          absolute -right-3 top-9 border border-blue-900 cursor-pointer 
          ${!open && "rotate-180"} transition-transform duration-300 z-10`}
          onClick={() => setOpen(!open)}
        />
        
        
        <div className="overflow-hidden">
          <div className="flex items-center">
            
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
              <span className="text-blue-900 font-bold text-sm">LOGO</span>
            </div>  
            
          
            <h1 className={`text-white ml-3 origin-left font-medium text-xl ${
              !open && "scale-0 opacity-0 w-0"
            } transition-all duration-300 whitespace-nowrap`}>
              MySite
            </h1>
          </div>
          
          <ul className="pt-6 space-y-2">
            <li className="text-blue-200 hover:bg-blue-800 rounded-md transition-colors duration-200">
              <Link 
                to="/table" 
                className="flex items-center p-2 text-sm"
              >
                <BsList className="text-xl shrink-0" />
                <span className={`ml-3 ${!open ? "opacity-0 w-0" : "opacity-100 w-auto"} transition-all duration-300 whitespace-nowrap`}>
                  Table
                </span>
              </Link>
            </li>
            
            <li className="text-blue-200 hover:bg-blue-800 rounded-md transition-colors duration-200">
              <Link 
                to="/dashboard" 
                className="flex items-center p-2 text-sm"
              >
                <MdDashboard className="text-xl shrink-0" />
                <span className={`ml-3 ${!open ? "opacity-0 w-0" : "opacity-100 w-auto"} transition-all duration-300 whitespace-nowrap`}>
                  Dashboard
                </span>
              </Link>
            </li>
            
            <li className="text-red-400 hover:bg-red-900 rounded-md transition-colors duration-200">
              <Link 
                to="/archive" 
                className="flex items-center p-2 text-sm"
              >
                <FaArchive className="text-xl shrink-0" />
                <span className={`ml-3 ${!open ? "opacity-0 w-0" : "opacity-100 w-auto"} transition-all duration-300 whitespace-nowrap`}>
                  Archive
                </span>
              </Link>
            </li>
            
            <li className="text-blue-200 hover:bg-blue-800 rounded-md transition-colors duration-200">
              <Link 
                to="/settings" 
                className="flex items-center p-2 text-sm"
              >
                <BsGear className="text-xl shrink-0" />
                <span className={`ml-3 ${!open ? "opacity-0 w-0" : "opacity-100 w-auto"} transition-all duration-300 whitespace-nowrap`}>
                  Settings
                </span>
              </Link>
            </li>
            
            <li onClick={()=>{logOut()}} className="text-blue-200 hover:bg-blue-800 rounded-md transition-colors duration-200">
              <div className="flex items-center p-2 text-sm cursor-pointer">
                <BsBoxArrowRight className="text-xl shrink-0" />
                <span className={`ml-3 ${!open ? "opacity-0 w-0" : "opacity-100 w-auto"} transition-all duration-300 whitespace-nowrap`}>
                  Logout
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      
      <div className="flex-1 p-7 bg-gray-100 overflow-auto relative">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold text-blue-900 mb-6">Data Overview</h1>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;