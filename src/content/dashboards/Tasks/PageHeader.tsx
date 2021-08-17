import { Typography, Avatar, Grid } from '@material-ui/core';


import { useTheme } from '@material-ui/core/styles';

function PageHeader() {

  const user =
  {
    name: 'Catherine Pike',
    avatar: '/static/images/avatars/1.jpg'
  };
  const theme = useTheme();

  return (
    <Grid container alignItems="center">
      <Grid item>
        <Avatar
          sx={{ mr: 2, width: theme.spacing(8), height: theme.spacing(8) }}
          variant="rounded"
          alt={user.name}
          src={user.avatar}
        />
      </Grid>
      <Grid item>
        <Typography variant="h3" component="h3" gutterBottom>
          Welcome, {user.name}!
        </Typography>
        <Typography variant="subtitle2">
          Manage your day to day tasks with style! Enjoy a well built UI system
        </Typography>
      </Grid>
    </Grid>
  );
}

export default PageHeader;