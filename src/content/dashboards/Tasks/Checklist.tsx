import React, { useState } from 'react';
import { Box, TextField, MenuItem, Card, CardHeader, Divider, CardContent, Typography } from '@mui/material';
import { Settings, Tune, Layers } from '@mui/icons-material';

function AdvancedSettings() {
  const [optim, setOptim] = useState("adamw_torch");

  const handleOptimChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptim(event.target.value);
  };

  return (
    <Card>
      <CardHeader title="Advanced Settings" />
      <Divider />
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" display="flex" alignItems="center" sx={{ mb: 2 }}>
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
          <Typography variant="h6" display="flex" alignItems="center" sx={{ mb: 2 }}>
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
          <Typography variant="h6" display="flex" alignItems="center" sx={{ mb: 2 }}>
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
    </Card>
  );
}

export default AdvancedSettings;
