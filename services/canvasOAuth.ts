import { Linking, Platform } from 'react-native';
const API=(process.env.EXPO_PUBLIC_ACADENCE_API_URL||'http://localhost:8787').replace(/\/$/,'');
export async function beginCanvasOAuth(baseUrl:string){const r=await fetch(`${API}/api/canvas/connect?baseUrl=${encodeURIComponent(baseUrl)}`);const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to connect Canvas.');if(Platform.OS==='web'){window.location.assign(data.authorizeUrl)}else await Linking.openURL(data.authorizeUrl)}
export async function getCanvasStatus(session:string){const r=await fetch(`${API}/api/canvas/status?session=${encodeURIComponent(session)}`);const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to load Canvas connection.');return data}
export async function syncCanvas(session:string){const r=await fetch(`${API}/api/canvas/sync?session=${encodeURIComponent(session)}`);const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to sync Canvas.');return data}
export async function disconnectCanvas(session:string){await fetch(`${API}/api/canvas/disconnect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session})})}
