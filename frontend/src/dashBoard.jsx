import React, { useState, useEffect } from 'react';
import { axiosClient } from "./Api/axios";

const DashBoard = () => {
  const [data,setData] = useState([])

  const fetcher = async ()=>{
    const response = await axiosClient.post(`/api/details/`);
    setData(response.data)
  }

  useEffect( async ()=>{
    fetcher()
  },[]);


  return (<>
    <p>  {JSON.stringify(data)} </p>
  </>);
};

export default DashBoard;