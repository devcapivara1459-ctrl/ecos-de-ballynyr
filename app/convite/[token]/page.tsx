import Journey from './journey';export default async function Invite({params}:{params:Promise<{token:string}>}){const {token}=await params;return <Journey token={token}/>}
