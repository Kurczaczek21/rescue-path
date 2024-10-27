import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Container } from "@mui/material";
import LandscapeIcon from "@mui/icons-material/Landscape";
import ExploreIcon from "@mui/icons-material/Explore";

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
        bgcolor: "#f0f4f8",
        padding: 3,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Box textAlign="center" mt={4}>
        {/* Ikona góry */}
        <LandscapeIcon sx={{ fontSize: 80, color: "#4CAF50", mb: 2 }} />

        <Typography variant="h3" component="h1" gutterBottom color="#2E7D32">
          Witamy w Safe Path
        </Typography>

        <Typography
          variant="body1"
          color="textSecondary"
          paragraph
          sx={{ color: "#546E7A" }}
        >
          Odkryj dane i rozpocznij analizę w intuicyjny sposób
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/file-upload")}
          startIcon={<ExploreIcon />}
          sx={{
            marginTop: 3,
            paddingX: 5,
            borderRadius: 4,
            bgcolor: "#388E3C",
            color: "#ffffff",
            "&:hover": {
              bgcolor: "#2E7D32",
            },
          }}
        >
          Przejdź dalej
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
