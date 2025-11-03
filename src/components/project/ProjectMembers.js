import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

function ProjectMembers() {
  const { id: projectId } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [membersInfo, setMembersInfo] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const isOwner = project?.ownerId === currentUser?.uid;

  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const projectData = { id: docSnap.id, ...docSnap.data() };
        setProject(projectData);
        fetchMembersInfo(projectData.members || []);
      } else {
        setError('Projekt nenalezen.');
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const fetchMembersInfo = async (memberUids) => {
    if (memberUids.length === 0) {
      setMembersInfo([]);
      return;
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', 'in', memberUids));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    setMembersInfo(users);
  };
  
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !isOwner) return;
    setError('');
    setMessage('');

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', inviteEmail));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
      setError('Uživatel s tímto e-mailem nebyl nalezen.');
      return;
    }
    
    const userIdToInvite = userSnapshot.docs[0].id;
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { members: arrayUnion(userIdToInvite) });
    
    setMessage(`Uživatel ${inviteEmail} byl úspěšně přidán.`);
    setInviteEmail('');
  };

  const handleRemoveMember = async (memberUid) => {
    if (!isOwner || memberUid === project.ownerId) {
      alert("Vlastníka projektu nelze odebrat.");
      return;
    }
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { members: arrayRemove(memberUid) });
  };

  return (
    <div className="space-y-8">
      {isOwner && (
        <div className="p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Pozvat nového člena</h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="E-mail uživatele" className="p-2 border rounded w-full"/>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Pozvat</button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
        </div>
      )}

      <div className="p-6 bg-white rounded-lg border">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Členové projektu</h3>
        <ul className="space-y-2">
          {membersInfo.map(member => (
            <li key={member.uid} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <div>
                <p className="font-medium">{member.displayName}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              {project?.ownerId === member.uid 
                ? <span className="text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded-full">Vlastník</span>
                : isOwner && (
                  <button onClick={() => handleRemoveMember(member.uid)} className="text-red-500 hover:text-red-700 text-sm">Odebrat</button>
                )
              }
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProjectMembers;
