import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { exportProjectToJSON } from './ExportUtils';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

const projectTypeDetails = {
    event: { label: 'Akce', badgeCode: 'bg-red-50 text-red-600 border-red-200', icon: 'fas fa-calendar-alt' },
    objekt: { label: 'Objekt', badgeCode: 'bg-blue-50 text-blue-600 border-blue-200', icon: 'fas fa-building' },
    kampus: { label: 'Areál', badgeCode: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fas fa-city' },
};

function ProjectCard({ project, onDelete }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Zjistíme, zda je aktuální uživatel vlastníkem projektu
    const isOwner = currentUser && currentUser.uid === project.ownerId;

    // Default to event if not found
    const details = projectTypeDetails[project.projectType] || projectTypeDetails.event;

    // Datum poslední editace
    const ts = project.lastEditedAt || project.updatedAt || project.lastModified || project.createdAt;
    const displayDate = ts?.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : null);
    const lastEditedDate = displayDate ? displayDate.toLocaleString('cs-CZ') : 'N/A';

    const handleOpenDeleteDialog = (e) => {
        e.stopPropagation();
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = (e) => {
        e.stopPropagation();
        setOpenDeleteDialog(false);
    };

    const handleDeleteProject = async (e) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'projects', project.id));
            if (onDelete) onDelete();
            handleCloseDeleteDialog(e);
        } catch (error) {
            console.error("Chyba při mazání projektu: ", error);
            // Even if unhandled in catch we should call onDelete for localMode fallback
            if (project.id.startsWith("local-")) {
                import('../services/localStore').then(({ removeProject }) => {
                    removeProject(project.id);
                    if (onDelete) onDelete();
                });
            }
        }
    };

    return (
        <div
            className="group bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer relative"
            onClick={() => navigate(`/project/${project.id}`)}
        >
            {/* Delete Button */}
            {isOwner && (
                <button
                    onClick={handleOpenDeleteDialog}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <i className="fas fa-trash-alt text-sm"></i>
                </button>
            )}

            <div className="mb-6 pr-8">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold mb-3 ${details.badgeCode}`}>
                    <i className={details.icon}></i>
                    {details.label}
                </div>
                <h2 className="text-xl font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {project.name}
                </h2>
                {project.organizationName && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                        <i className="fas fa-briefcase mr-2"></i>{project.organizationName}
                    </p>
                )}
                {project.authorName && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        <i className="fas fa-user-edit mr-2"></i>{project.authorName}
                    </p>
                )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div className="text-xs text-gray-400 flex items-center">
                    <i className="far fa-clock mr-1.5"></i>
                    Upraveno: {lastEditedDate}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        exportProjectToJSON(project);
                    }}
                    className="text-sm text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 py-2 rounded-lg font-medium transition-colors text-center border border-gray-100"
                >
                    <i className="fas fa-download mr-1.5"></i>
                    Exportovat jako JSON
                </button>
            </div>

            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle className="font-bold text-gray-900">Smazat projekt?</DialogTitle>
                <DialogContent>
                    <DialogContentText className="text-gray-600">
                        Opravdu chcete trvale smazat projekt <strong>"{project.name}"</strong>? Tuto akci nelze vrátit zpět.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDeleteDialog} sx={{ color: 'gray' }}>Zrušit</Button>
                    <Button onClick={handleDeleteProject} variant="contained" color="error" disableElevation>
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ProjectCard;