import React, { ChangeEvent, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import Footer from 'src/components/Footer';
import {
  Grid,
  Tab,
  Tabs,
  Divider,
  Container,
  Card,
  Box,
  useTheme,
  styled,
  Checkbox,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
  TextField,
  IconButton,
  Collapse,
  Typography,
  CardContent,
  MenuItem
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CircularProgress from '@mui/material/CircularProgress';
import FileUploadIcon from '@mui/icons-material/FileUpload';

// Icon imports for Advanced Settings
import Settings from '@mui/icons-material/Settings';
import Tune from '@mui/icons-material/Tune';
import Layers from '@mui/icons-material/Layers';

import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Checklist from './Checklist';
import TaskSearch from './TaskSearch';

const TabsContainerWrapper = styled(Box)(
  ({ theme }) => `
      padding: 0 ${theme.spacing(2)};
      position: relative;
      bottom: -1px;

      .MuiTabs-root {
        height: 44px;
        min-height: 44px;
      }

      .MuiTabs-scrollableX {
        overflow-x: auto !important;
      }

      .MuiTabs-indicator {
          min-height: 4px;
          height: 4px;
          box-shadow: none;
          bottom: -4px;
          background: none;
          border: 0;

          &:after {
            position: absolute;
            left: 50%;
            width: 28px;
            content: ' ';
            margin-left: -14px;
            background: ${theme.colors.primary.main};
            border-radius: inherit;
            height: 100%;
          }
      }

      .MuiTab-root {
          &.MuiButtonBase-root {
              height: 44px;
              min-height: 44px;
              background: ${theme.colors.alpha.white[50]};
              border: 1px solid ${theme.colors.alpha.black[10]};
              border-bottom: 0;
              position: relative;
              margin-right: ${theme.spacing(1)};
              font-size: ${theme.typography.pxToRem(14)};
              color: ${theme.colors.alpha.black[80]};
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;

              .MuiTouchRipple-root {
                opacity: .1;
              }

              &:after {
                position: absolute;
                left: 0;
                right: 0;
                width: 100%;
                bottom: 0;
                height: 1px;
                content: '';
                background: ${theme.colors.alpha.black[10]};
              }

              &:hover {
                color: ${theme.colors.alpha.black[100]};
              }
          }

          &.Mui-selected {
              color: ${theme.colors.alpha.black[100]};
              background: ${theme.colors.alpha.white[100]};
              border-bottom-color: ${theme.colors.alpha.white[100]};

              &:after {
                height: 0;
              }
          }
      }
  `
);

function DashboardTasks() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('analytics');

  const tabs = [
    { value: 'analytics', label: 'Finetune VLM' },
    { value: 'taskSearch', label: 'Model Search' }
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };

  // Rows & pagination
  interface RowData {
    checked: boolean;
    image: string | null;
    input: string;
    output: string;
  }

  const [rows, setRows] = useState<RowData[]>([
    {
      checked: false,
      image: null,
      input: '',
      output: ''
    }
  ]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers
  const handleCheckboxChange = (index: number) => {
    setRows((prevRows) => {
      const updated = [...prevRows];
      updated[index].checked = !updated[index].checked;
      return updated;
    });
  };

  const handleImageUpload = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);

      setRows((prevRows) => {
        const updated = [...prevRows];
        updated[index].image = imageURL;
        return updated;
      });
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const text = e.target.result.toString().trim();
      if (!text) {
        console.error('CSV is empty!');
        return;
      }
  
      // 1) Try to detect delimiter (basic approach)
      let delimiter = ',';
      if (text.includes(';') && !text.includes(',')) {
        delimiter = ';';
      }
  
      // 2) Split lines
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        console.error('CSV appears empty or has no data rows');
        return;
      }
  
      // 3) Parse header row (case-insensitive, strip quotes/spaces)
      const headerRaw = lines[0].split(delimiter).map((h) => {
        return h.replace(/^"|"$/g, '').trim().toLowerCase();
      });
  
      // Required columns:
      const inputIdx = headerRaw.indexOf('input');
      const outputIdx = headerRaw.indexOf('output');
  
      // Optional column:
      const imageIdx = headerRaw.indexOf('image_url');
  
      // If required columns are missing, exit
      if (inputIdx === -1 || outputIdx === -1) {
        console.error('CSV must have at least input and output columns (check spelling or case).');
        return;
      }
  
      // 4) Build new rows
      const newRows: RowData[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Split row by delimiter, strip quotes/spaces
        const cells = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
        if (cells.length < headerRaw.length) continue; // skip incomplete lines
  
        const userInput = cells[inputIdx] || '';
        const userOutput = cells[outputIdx] || '';
  
        // If image_url column exists, take its value. Otherwise, no image.
        let imageUrl = '';
        if (imageIdx !== -1) {
          imageUrl = cells[imageIdx] || '';
        }
  
        newRows.push({
          checked: false,
          image: imageUrl ? imageUrl : null,
          input: userInput,
          output: userOutput
        });
      }
  
      // 5) Append these new rows
      setRows((prevRows) => [...prevRows, ...newRows]);
    };
  
    reader.readAsText(file);
  };
  
  

  const handleInputChange = (index: number, value: string) => {
    setRows((prevRows) => {
      const updated = [...prevRows];
      updated[index].input = value;
      return updated;
    });
  };

  const handleOutputChange = (index: number, value: string) => {
    setRows((prevRows) => {
      const updated = [...prevRows];
      updated[index].output = value;
      return updated;
    });
  };

  const handleAddRow = () => {
    setRows((prevRows) => [
      ...prevRows,
      {
        checked: false,
        image: null,
        input: '',
        output: ''
      }
    ]);
  };

  const handleRemoveRow = (targetIndex: number) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== targetIndex));
  };

  // --- New state/handlers for advanced settings and finetuning ---
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isFinetuning, setIsFinetuning] = useState(false);

  // State for the "Optimizer" dropdown
  const [optim, setOptim] = useState('adamw_torch');
  const handleOptimChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptim(event.target.value);
  };

  const handleStartFinetuning = () => {
    setIsFinetuning(true);
    // Simulate or initiate an actual finetuning process
    // For demonstration, we keep it disabled for 5 seconds:
    setTimeout(() => {
      // If you want to re-enable the button later, you can reset isFinetuning here:
      // setIsFinetuning(false);
    }, 5000);
  };

  return (
    <>
      <Helmet>
        <title>Tasks Dashboard</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <TabsContainerWrapper>
          <Tabs
            onChange={handleTabsChange}
            value={currentTab}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </TabsContainerWrapper>

        <Card variant="outlined">
          <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={0}>
            {currentTab === 'analytics' && (
              <>
                {/* Model Settings */}
                <Grid item xs={12}>
                  <Box p={4}>
                    <Grid item xs={12}>
                      <Card sx={{ width: '100%' }}>
                        <CardHeader title="Model Settings" />
                        <Divider />
                        <Box p={4}>
                          <Grid container spacing={2}>
                            {/* Tuned Model Name (half-width) */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Tuned Model Name"
                                variant="outlined"
                                placeholder="Enter tuned model name"
                              />
                            </Grid>

                            {/* Choose Base Model (Dropdown, half-width) */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                fullWidth
                                label="Choose Base Model"
                                variant="outlined"
                                value="Phi3-V" // Default selection
                                SelectProps={{ native: true }}
                              >
                                <option value="Phi3-V">Phi3-V</option>
                                <option value="SmolVLM">SmolVLM</option>
                                <option value="Qwen2-VL">Qwen2-VL</option>
                                <option value="BLIP2">BLIP2</option>
                                <option value="Llava">Llava</option>
                                <option value="MobileVLM">MobileVLM</option>
                              </TextField>
                            </Grid>

                            {/* Description (full-width) */}
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="Description"
                                variant="outlined"
                                placeholder="Enter a description for the model"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Card>
                    </Grid>

                    {/* Collapsible Advanced Settings */}
                    <Grid item xs={12}>
                      <Card sx={{ mt: 2 }}>
                        <CardHeader
                          title="Advanced Settings"
                          action={
                            <IconButton onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>
                              {showAdvancedSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          }
                        />
                        <Collapse in={showAdvancedSettings}>
                          <Divider />
                          {/* Your Advanced Settings Content */}
                          <CardContent>
                            <Box sx={{ mb: 4 }}>
                              <Typography
                                variant="h6"
                                display="flex"
                                alignItems="center"
                                sx={{ mb: 2 }}
                              >
                                <Settings fontSize="small" sx={{ mr: 1 }} />
                                Hyperparameters
                              </Typography>
                              <TextField
                                label="Epoch"
                                type="number"
                                InputProps={{ inputProps: { min: 1, max: 100 } }}
                                defaultValue={1}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Learning Rate"
                                type="number"
                                InputProps={{ inputProps: { step: 0.0001 } }}
                                defaultValue={0.0001}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Warmup Ratio"
                                type="number"
                                InputProps={{ inputProps: { step: 0.1, min: 0, max: 1 } }}
                                defaultValue={0.1}
                                sx={{ m: 1, width: '25ch' }}
                              />
                            </Box>
                            <Divider sx={{ my: 3 }} />
                            <Box sx={{ mb: 4 }}>
                              <Typography
                                variant="h6"
                                display="flex"
                                alignItems="center"
                                sx={{ mb: 2 }}
                              >
                                <Tune fontSize="small" sx={{ mr: 1 }} />
                                Gradients
                              </Typography>
                              <TextField
                                label="Optimizer"
                                select
                                value={optim}
                                onChange={handleOptimChange}
                                sx={{ m: 1, width: '25ch' }}
                              >
                                <MenuItem value="adamw_torch">adamw_torch</MenuItem>
                                <MenuItem value="adamw_hf">adamw_hf</MenuItem>
                              </TextField>
                              <TextField
                                label="Gradient Accumulation Steps"
                                type="number"
                                defaultValue={64}
                                InputProps={{ inputProps: { min: 1 } }}
                                sx={{ m: 1, width: '25ch' }}
                              />
                            </Box>
                            <Divider sx={{ my: 3 }} />
                            <Box>
                              <Typography
                                variant="h6"
                                display="flex"
                                alignItems="center"
                                sx={{ mb: 2 }}
                              >
                                <Layers fontSize="small" sx={{ mr: 1 }} />
                                LoRA
                              </Typography>
                              <TextField
                                label="Peft R"
                                type="number"
                                InputProps={{ inputProps: { min: 1, max: 32 } }}
                                defaultValue={8}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Peft Alpha"
                                type="number"
                                InputProps={{ inputProps: { min: 1, max: 32 } }}
                                defaultValue={16}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Peft Dropout"
                                type="number"
                                InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                                defaultValue={0.05}
                                sx={{ m: 1, width: '25ch' }}
                              />
                            </Box>
                          </CardContent>
                        </Collapse>
                      </Card>
                    </Grid>
                  </Box>
                </Grid>

                {/* Table for structured data */}
                <Grid item xs={12}>
                  <Divider />
                  <Box p={4} sx={{ background: `${theme.colors.alpha.black[5]}` }}>
                    <Grid container>
                      <Card sx={{ width: '100%' }}>
                        <CardHeader title="Create Structured Data" />
                        <Divider />
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox">
                                  <Checkbox color="primary" />
                                </TableCell>
                                <TableCell>Image</TableCell>
                                <TableCell>Input</TableCell>
                                <TableCell>Output</TableCell>
                                <TableCell align="center" width={70}>
                                  X
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, i) => {
                                  const actualIndex = i + page * rowsPerPage;
                                  return (
                                    <TableRow key={actualIndex} sx={{ verticalAlign: 'top' }}>
                                      <TableCell padding="checkbox" sx={{ width: '3%' }}>
                                        <Checkbox
                                          color="primary"
                                          checked={row.checked}
                                          onChange={() => handleCheckboxChange(actualIndex)}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ width: '20%' }}>
                                        {row.image && (
                                          <Box
                                            component="img"
                                            src={row.image}
                                            alt="Uploaded"
                                            sx={{
                                              display: 'block',
                                              width: '100%',
                                              height: 'auto',
                                              objectFit: 'contain',
                                              borderRadius: 1,
                                              mb: 1
                                            }}
                                          />
                                        )}
                                        <Box display="flex" justifyContent="left">
                                          <Button variant="outlined" component="label" color="primary">
                                            Upload
                                            <input
                                              type="file"
                                              hidden
                                              accept="image/*"
                                              onChange={(e) => handleImageUpload(actualIndex, e)}
                                            />
                                          </Button>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <TextField
                                          variant="outlined"
                                          multiline
                                          minRows={3}
                                          fullWidth
                                          value={row.input}
                                          onChange={(e) => handleInputChange(actualIndex, e.target.value)}
                                          placeholder="The user's input"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <TextField
                                          variant="outlined"
                                          multiline
                                          minRows={3}
                                          fullWidth
                                          value={row.output}
                                          onChange={(e) => handleOutputChange(actualIndex, e.target.value)}
                                          placeholder="The model's response"
                                        />
                                      </TableCell>
                                      <TableCell align="center" sx={{ width: '3%' }}>
                                        <IconButton
                                          color="error"
                                          size="small"
                                          onClick={() => handleRemoveRow(actualIndex)}
                                        >
                                          <CloseIcon />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* Pagination, Add Row, and Start Finetuning */}
                        <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
                          <TablePagination
                            component="div"
                            count={rows.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                          />
                          <Box display="flex" alignItems="center">
                            <Button variant="contained" onClick={handleAddRow} sx={{ mr: 2 }}>
                              Add Row
                            </Button>

                            <Button
                              variant="outlined"
                              component="label"
                              startIcon={<FileUploadIcon />}
                              sx={{ mr: 1 }}
                            >
                              Upload CSV
                              <input
                                type="file"
                                hidden
                                accept=".csv"
                                onChange={handleCSVUpload}
                              />
                            </Button>

                            {/* Footnote beside the button */}
                            <Box>
                              <span
                                style={{
                                  fontSize: '0.7em', // Small font size
                                  color: 'red', // Red text for emphasis
                                  lineHeight: '1.2em', // Adjust line spacing
                                }}
                              >
                                *input, output, and<br />
                                image_url columns
                              </span>
                            </Box>
                          </Box>
                        </Box>

      {/* 4) Small footnote about CSV format (place this where you prefer) */}
      {/* <Typography variant="caption" sx={{ ml: 2 }}>
        <i>CSV must include headers: image_url, input, and output. The image_url can be empty.</i>
      </Typography> */}
                      </Card>
                    </Grid>
                  </Box>
                  <Divider />
                </Grid>

                {/* Logs Box */}
                <Grid item xs={12}>
                  <Box p={4} sx={{ background: `${theme.colors.alpha.white[70]}` }}>
                    {/* Start Finetuning Button */}
                    <Button
                      variant="contained"
                      color="info" // Green button
                      fullWidth // Full-width
                      sx={{ mb: 2 }} // Margin bottom of 2
                      onClick={handleStartFinetuning}
                      startIcon={
                        isFinetuning ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <PlayArrowIcon />
                        )
                      }
                      disabled={isFinetuning}
                    >
                      {isFinetuning ? 'Finetuning...' : 'Start Finetuning'}
                    </Button>

                    {/* Logs Box */}
                    <Card>
                      <CardHeader title="Logs" />
                      <Divider />
                      <Box p={2} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                        <Typography variant="body2">
                          {/* You can display logs here (append log messages as needed) */}
                          Logs will appear here when you start finetuning..
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                </Grid>

              </>
            )}

            {currentTab === 'taskSearch' && (
              <Grid item xs={12}>
                <Box p={4}>
                  <TaskSearch />
                </Box>
              </Grid>
            )}
          </Grid>
        </Card>
      </Container>
      <Footer />
    </>
  );
}

export default DashboardTasks;
