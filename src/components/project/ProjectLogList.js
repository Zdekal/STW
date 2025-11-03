import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';

function ProjectLogList() {
  const { id: projectId } = useParams();
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [newLog, setNewLog] = useState({ 
    eventDate: '', 
    eventTime: '',
    place: '', 
    type: '', 
    event: '', 
    status: '',
    authorName: auth.currentUser?.email || ''
  });

  useEffect(() => {
    setNewLog(prev => ({...prev, authorName: auth.currentUser?.email || ''}));
  }, [auth.currentUser]);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectName = async () => {
        const projectRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
            setProjectName(docSnap.data().name);
        }
    };
    fetchProjectName();

    const q = query(collection(db, 'projects', projectId, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // --- ZMĚNA: Přidáváme informaci o stavu ukládání ---
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isSaving: doc.metadata.hasPendingWrites, // Zjistíme, zda se záznam ještě ukládá
        jsDate: doc.data().timestamp?.toDate(),
        eventHappenedAt: doc.data().eventTimestamp?.toDate()
      }));
      setAllLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Chyba při načítání LogListu: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    let logs = [...allLogs];
    if (typeFilter) {
      logs = logs.filter(log => log.type === typeFilter);
    }
    if (dateFilter) {
      logs = logs.filter(log => log.jsDate && log.jsDate.toISOString().slice(0, 10) === dateFilter);
    }
    setFilteredLogs(logs);
  }, [typeFilter, dateFilter, allLogs]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.event || !newLog.type || !newLog.eventDate || !newLog.eventTime || !newLog.authorName) {
      alert("Prosím vyplňte datum, čas, typ, událost a kdo záznam zapsal.");
      return;
    }
    
    const eventTimestamp = new Date(`${newLog.eventDate}T${newLog.eventTime}`);

    try {
      await addDoc(collection(db, 'projects', projectId, 'logs'), {
        place: newLog.place || '',
        type: newLog.type,
        event: newLog.event,
        status: newLog.status || 'Otevřený',
        author: newLog.authorName,
        eventTimestamp: eventTimestamp,
        timestamp: serverTimestamp()
      });
      setNewLog({ 
          eventDate: '', eventTime: '', place: '', type: '', event: '', status: '',
          authorName: auth.currentUser?.email || ''
      });
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  const handleExportDocx = async () => {
    const columnsToExport = columns.filter(c => c.field !== 'actions' && c.field !== 'id');

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: columnsToExport.map(col => new TableCell({ children: [new Paragraph({ text: col.headerName, bold: true })] })),
        }),
        ...filteredLogs.map(log => new TableRow({
          children: columnsToExport.map(col => {
            let cellData = log[col.field] || '';
            if (col.field === 'eventTimestamp' && log.eventHappenedAt) {
              cellData = log.eventHappenedAt.toLocaleString('cs-CZ');
            } else if (col.field === 'timestamp' && log.jsDate) {
              cellData = log.jsDate.toLocaleString('cs-CZ');
            } else if (col.field === 'timestamp' && !log.jsDate) {
              cellData = '-'; // Pro chybějící data v exportu
            }
            return new TableCell({ children: [new Paragraph(String(cellData))] });
          }),
        })),
      ],
    });

    const doc = new Document({
      sections: [{
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: 'Soft Targets Prep', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: projectName, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
          new Paragraph({ text: 'Výpis událostí', heading: HeadingLevel.HEADING_2, spacing: { after: 400 } }),
          table,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `log-udalosti-${projectName}.docx`);
  };

  const columns = useMemo(() => [
    { 
      field: 'timestamp', 
      headerName: 'Čas záznamu', 
      type: 'dateTime', 
      width: 160,
      valueGetter: (params) => params?.row?.jsDate,
      // --- ZMĚNA: Vylepšená logika pro zobrazení ---
      renderCell: (params) => {
        if (params.row.isSaving) {
          return <span className="text-gray-500 italic">Ukládání...</span>;
        }
        if (params.value) {
          return params.value.toLocaleString('cs-CZ');
        }
        return <span className="text-gray-400">-</span>; // Zobrazí pomlčku, pokud data chybí
      }
    },
    { 
      field: 'eventTimestamp', 
      headerName: 'Čas události', 
      type: 'dateTime', 
      width: 160,
      valueGetter: (params) => params?.row?.eventHappenedAt,
      valueFormatter: (params) => params?.value ? params.value.toLocaleString('cs-CZ') : ''
    },
    { field: 'author', headerName: 'Zapsal', width: 180 },
    { field: 'place', headerName: 'Místo', width: 130, editable: true },
    { field: 'type', headerName: 'Typ záznamu', width: 130, editable: true },
    { field: 'event', headerName: 'Událost', flex: 1, minWidth: 200, editable: true },
    { field: 'status', headerName: 'Stav', width: 120, editable: true },
  ], []);

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gray-50 rounded-lg border">
        <h3 className="text-xl font-semibold text-gray-800 mb-5">Přidat nový záznam</h3>
        <form onSubmit={handleAddLog} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TextField label="Datum události" type="date" value={newLog.eventDate} onChange={(e) => setNewLog({ ...newLog, eventDate: e.target.value })} InputLabelProps={{ shrink: true }} variant="outlined" required />
            <TextField label="Čas události" type="time" value={newLog.eventTime} onChange={(e) => setNewLog({ ...newLog, eventTime: e.target.value })} InputLabelProps={{ shrink: true }} variant="outlined" required />
            <TextField label="Místo" value={newLog.place} onChange={(e) => setNewLog({ ...newLog, place: e.target.value })} variant="outlined" />
            <TextField label="Stav" value={newLog.status} onChange={(e) => setNewLog({ ...newLog, status: e.target.value })} variant="outlined" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Typ události"
                value={newLog.type}
                onChange={(e) => setNewLog({ ...newLog, type: e.target.value })}
                variant="outlined"
                required
              />
              <TextField
                label="Zapsal (Jméno/Email)"
                value={newLog.authorName}
                onChange={(e) => setNewLog({ ...newLog, authorName: e.target.value })}
                variant="outlined"
                required
              />
          </div>
          <div>
            <TextField
              label="Popis události"
              value={newLog.event}
              onChange={(e) => setNewLog({ ...newLog, event: e.target.value })}
              variant="outlined"
              required
              multiline
              rows={4}
              fullWidth
            />
          </div>
          <div className="text-right">
            <Button type="submit" variant="contained" color="primary" size="large">
              Přidat záznam
            </Button>
          </div>
        </form>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg border">
        <h3 className="text-xl font-semibold text-gray-800 mb-5">Filtry a Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <TextField
            label="Filtrovat podle data"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
          />
          <FormControl variant="outlined" size="small">
            <InputLabel>Filtrovat podle typu</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Filtrovat podle typu"
            >
              <MenuItem value=""><em>Všechny typy</em></MenuItem>
              <MenuItem value="Incident">Incident</MenuItem>
              <MenuItem value="Poznámka">Poznámka</MenuItem>
              <MenuItem value="Zásah">Zásah</MenuItem>
            </Select>
          </FormControl>
          <Button onClick={handleExportDocx} variant="outlined" color="primary">
            Uložit
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Historie událostí</h3>
        <p className="text-sm text-gray-600">Zobrazeno {filteredLogs.length} z {allLogs.length} záznamů.</p>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            loading={loading}
            components={{ Toolbar: GridToolbar }}
            density="compact"
            processRowUpdate={async (updatedRow) => {
                const logRef = doc(db, 'projects', projectId, 'logs', updatedRow.id);
                await updateDoc(logRef, updatedRow);
                return updatedRow;
            }}
            onProcessRowUpdateError={(error) => console.error(error)}
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectLogList;
