import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Container } from "@mui/material";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Box textAlign="center" mt={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Witamy w Safe Path
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Odkryj dane i rozpocznij analizę w intuicyjny sposób.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/file-upload")}
          sx={{
            marginTop: 3,
            paddingX: 5,
            borderRadius: 4,
          }}
        >
          Przejdź dalej
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
