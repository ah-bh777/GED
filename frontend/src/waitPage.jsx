import { useParams } from "react-router-dom"

export default function Waiting(){

    const {id} = useParams()

    return(<>
        {id}
    </>)
}