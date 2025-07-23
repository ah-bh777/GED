import React, { useContext , useState, useEffect } from 'react';
import { axiosClient } from "./Api/axios";

const DashBoard = () => {
const admin = localStorage.getItem("ADMIN_INFO")

  return (<>
{admin}
  </>);
};

export default DashBoard;