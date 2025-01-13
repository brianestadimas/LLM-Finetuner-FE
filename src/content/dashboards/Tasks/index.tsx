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
  const API_HOST = process.env.REACT_APP_API_HOST; 
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('analytics');

  const tabs = [
    { value: 'analytics', label: 'Finetune VLM' },
    { value: 'taskSearch', label: 'Model Search' }
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };

  //
  // 1) RowData: add `file?: File` so we can keep the actual file for uploading
  //
  interface RowData {
    checked: boolean;
    image: string | null; // for preview
    file?: File;          // actual file to upload
    input: string;
    output: string;
  }

  // 2) Table state
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

  const handleCheckboxChange = (index: number) => {
    setRows((prevRows) => {
      const updated = [...prevRows];
      updated[index].checked = !updated[index].checked;
      return updated;
    });
  };

  //
  // 3) Modify handleImageUpload to also store the File object in row.file
  //
  const handleImageUpload = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);

      setRows((prevRows) => {
        const updated = [...prevRows];
        updated[index].image = imageURL; // preview
        updated[index].file = file;      // actual file for upload
        return updated;
      });
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      const text = e.target.result.toString().trim();
      if (!text) {
        console.error('CSV is empty!');
        return;
      }
  
      let delimiter = ',';
      if (text.includes(';') && !text.includes(',')) {
        delimiter = ';';
      }
  
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        console.error('CSV appears empty or has no data rows');
        return;
      }
  
      const headerRaw = lines[0].split(delimiter).map((h) =>
        h.replace(/^"|"$/g, '').trim().toLowerCase()
      );
  
      const inputIdx = headerRaw.indexOf('input');
      const outputIdx = headerRaw.indexOf('output');
      const imageIdx = headerRaw.indexOf('image_url');
  
      if (inputIdx === -1 || outputIdx === -1) {
        console.error('CSV must have at least input and output columns.');
        return;
      }
  
      const sanitizeUrl = (url: string): string => {
        return url.replace(/['"]/g, '').replace(/\s+alt=.*$/, '').trim();
      };
  
      const newRows: RowData[] = [];
      // Process CSV rows
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
        if (cells.length < headerRaw.length) continue;
  
        const userInput = cells[inputIdx] || '';
        const userOutput = cells[outputIdx] || '';
        let imageUrl = '';
  
        if (imageIdx !== -1) {
          imageUrl = cells[imageIdx] || '';
        }
  
        newRows.push({
          checked: false,
          image: imageUrl || null,
          file: undefined,
          input: userInput,
          output: userOutput
        });
      }
  
      // Fetch images for all rows
      for (let i = 0; i < newRows.length; i++) {
        const row = newRows[i];
        if (row.image) {
          try {
            const sanitizedUrl = sanitizeUrl(row.image);
            console.log(`Fetching image for row ${i}: ${sanitizedUrl}`);
            const response = await fetch(sanitizedUrl, { redirect: 'follow' });
  
            if (!response.ok) {
              console.error(`Failed to fetch image for row ${i}: ${sanitizedUrl}`);
              continue;
            }
  
            const blob = await response.blob();
            const uniqueFilename = `image_${i}_${Date.now()}.jpg`;
            row.file = new File([blob], uniqueFilename, { type: blob.type });
  
            // Optional: for preview, use an ObjectURL
            row.image = URL.createObjectURL(row.file);
          } catch (err) {
            console.error(`Error fetching image for row ${i}:`, err);
          }
        }
      }
  
      // Add rows to state
      setRows((prev) => [...prev, ...newRows]);
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

  //
  // 4) New state for all your model/hyperparams
  //
  const [modelName, setModelName] = useState('');
  const [baseModel, setBaseModel] = useState('Phi3-V');
  const [description, setDescription] = useState('');

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isFinetuning, setIsFinetuning] = useState(false);

  // Hyperparams
  const [epoch, setEpoch] = useState(1);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [warmupRatio, setWarmupRatio] = useState(0.1);

  // Optimizer
  const [optim, setOptim] = useState('adamw_torch');
  const [gradientSteps, setGradientSteps] = useState(64);

  // LoRA
  const [peftR, setPeftR] = useState(8);
  const [peftAlpha, setPeftAlpha] = useState(16);
  const [peftDropout, setPeftDropout] = useState(0.05);

  const handleOptimChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptim(event.target.value);
  };

  //
  // 5) handleStartFinetuning - build FormData, POST to /run_model
  //
  const handleStartFinetuning = async () => {
    setIsFinetuning(true);
    try {
      // 1) Build metadata
      const metadata = {
        model_name: modelName,
        base_model: baseModel,
        description: description,
        epoch,
        learning_rate: learningRate,
        warmup_ratio: warmupRatio,
        optimizer: optim,
        gradient_accumulation_steps: gradientSteps,
        peft_r: peftR,
        peft_alpha: peftAlpha,
        peft_dropout: peftDropout,
        data: rows.map((row, idx) => ({
          rowIndex: idx,
          input: row.input,
          output: row.output
        }))
      };
  
      // 2) Build FormData
      const formData = new FormData();
      formData.append('data', JSON.stringify(metadata));
  
      // 3) Append each file using the SAME field name "files"
      rows.forEach((row, idx) => {
        if (row.file) {
          console.log(`Appending file for row #${idx}: ${row.file.name}, size=${row.file.size}`);
          formData.append('files', row.file);
        }
      });
  
      // (Optional) debug how many 'files' were actually appended
      const appendedFiles = formData.getAll('files'); // getAll returns an array
      console.log('Number of appended files:', appendedFiles.length);
  
      // 4) POST to /run_model
      const response = await fetch(`${API_HOST}/run_model`, {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Failed to start finetuning');
      }
  
      const result = await response.json();
      console.log('Finetuning started:', result);
  
    } catch (error) {
      console.error('Error during finetuning:', error);
    } finally {
      setIsFinetuning(false);
    }
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
                            {/* Tuned Model Name */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Tuned Model Name"
                                variant="outlined"
                                placeholder="Enter tuned model name"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                              />
                            </Grid>

                            {/* Choose Base Model */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                select
                                fullWidth
                                label="Choose Base Model"
                                variant="outlined"
                                value={baseModel}
                                onChange={(e) => setBaseModel(e.target.value)}
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

                            {/* Description */}
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="Description"
                                variant="outlined"
                                placeholder="Enter a description for the model"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Card>
                    </Grid>

                    {/* Advanced Settings */}
                    <Grid item xs={12}>
                      <Card sx={{ mt: 2 }}>
                        <CardHeader
                          title="Advanced Settings"
                          action={
                            <IconButton
                              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                            >
                              {showAdvancedSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          }
                        />
                        <Collapse in={showAdvancedSettings}>
                          <Divider />
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
                                value={epoch}
                                onChange={(e) => setEpoch(+e.target.value)}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Learning Rate"
                                type="number"
                                InputProps={{ inputProps: { step: 0.0001 } }}
                                value={learningRate}
                                onChange={(e) => setLearningRate(+e.target.value)}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Warmup Ratio"
                                type="number"
                                InputProps={{ inputProps: { step: 0.1, min: 0, max: 1 } }}
                                value={warmupRatio}
                                onChange={(e) => setWarmupRatio(+e.target.value)}
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
                                value={gradientSteps}
                                onChange={(e) => setGradientSteps(+e.target.value)}
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
                                value={peftR}
                                onChange={(e) => setPeftR(+e.target.value)}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Peft Alpha"
                                type="number"
                                InputProps={{ inputProps: { min: 1, max: 32 } }}
                                value={peftAlpha}
                                onChange={(e) => setPeftAlpha(+e.target.value)}
                                sx={{ m: 1, width: '25ch' }}
                              />
                              <TextField
                                label="Peft Dropout"
                                type="number"
                                InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                                value={peftDropout}
                                onChange={(e) => setPeftDropout(+e.target.value)}
                                sx={{ m: 1, width: '25ch' }}
                              />
                            </Box>
                          </CardContent>
                        </Collapse>
                      </Card>
                    </Grid>
                  </Box>
                </Grid>

                {/* Structured Data Table */}
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
                                          <Button
                                            variant="outlined"
                                            component="label"
                                            color="primary"
                                          >
                                            Upload
                                            <input
                                              type="file"
                                              hidden
                                              accept="image/*"
                                              onChange={(e) =>
                                                handleImageUpload(actualIndex, e)
                                              }
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
                                          onChange={(e) =>
                                            handleInputChange(actualIndex, e.target.value)
                                          }
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
                                          onChange={(e) =>
                                            handleOutputChange(actualIndex, e.target.value)
                                          }
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

                        <Box
                          p={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                        >
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
                            <Button
                              variant="contained"
                              onClick={handleAddRow}
                              sx={{ mr: 2 }}
                            >
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

                            <Box>
                              <span
                                style={{
                                  fontSize: '0.7em',
                                  color: 'red',
                                  lineHeight: '1.2em'
                                }}
                              >
                                *input, output, and<br />
                                image_url columns
                              </span>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  </Box>
                  <Divider />
                </Grid>

                {/* Logs & Start Finetuning */}
                <Grid item xs={12}>
                  <Box p={4} sx={{ background: `${theme.colors.alpha.white[70]}` }}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      sx={{ mb: 2 }}
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

                    <Card>
                      <CardHeader title="Logs" />
                      <Divider />
                      <Box p={2} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                        <Typography variant="body2">
                          Logs will appear here when you start finetuning...
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
