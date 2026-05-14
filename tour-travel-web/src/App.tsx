import { RouterProvider } from "react-router-dom";
import router from "./app/router";
import { AuthProvider } from "./store/AuthContext"; 

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;