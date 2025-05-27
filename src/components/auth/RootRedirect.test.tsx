
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import RootRedirect from "./RootRedirect";
import { useUser } from "@/contexts/UserContext";

// Mock the useUser hook
jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}));

// Helper component to display the current location
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

describe("RootRedirect", () => {
  it("redirects to /home when authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<LocationDisplay />} />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("location-display")).toBeInTheDocument();
    expect(screen.getByTestId("location-display").textContent).toBe("/home");
  });

  it("redirects to /login when not authenticated", () => {
    (useUser as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<LocationDisplay />} />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("location-display")).toBeInTheDocument();
    expect(screen.getByTestId("location-display").textContent).toBe("/login");
  });
});
