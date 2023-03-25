import * as React from "react";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import {
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
} from "@mui/material";
import { LocalAtmOutlined } from "@mui/icons-material";
import { useContext, useEffect, useState, useReducer } from "react";
import { Store } from "../../Store";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";

const steps = ["Address", "Payment", "Confirm"];

const reducer = (state, action) => {
  switch (action.type) {
    case "CREATE_REQUEST":
      return { ...state, loading: true };
    case "CREATE_SUCCESS":
      return { ...state, loading: false };
    case "CREATE_FAIL":
      return { ...state, loading: false };
    default:
      return state;
  }
};

export default function Review() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const [order, setOrder] = useState(0);
  const { cart, userInfo } = state;
  const [{ loading }, dispatch] = useReducer(reducer, {
    loading: false,
  });
  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  cart.itemsPrice = round2(
    cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
  );

  cart.shippingPrice = cart.itemsPrice > 100 ? round2(5) : round2(10);
  cart.taxPrice = round2(0.06 * cart.itemsPrice);
  cart.totalPrice = cart.itemsPrice + cart.shippingPrice + cart.taxPrice;

  const navigate = useNavigate();
  const placeOrderHandler = async () => {
    try {
      dispatch({ type: "CREATE_REQUEST" });
      const { data } = await axios.post(
        "/api/orders",
        {
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          totalPrice: cart.totalPrice,
          taxPrice: cart.taxPrice,
        },
        {
          headers: {
            authorization: `Bearer ${userInfo.userInfo.token}`,
          },
        }
      );
      ctxDispatch({ type: "CART_CLEAR" });
      dispatch({ type: "CREATE_SUCCESS" });
      localStorage.removeItem("cartItems");
      setOrder(1);
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
    }
  };
  useEffect(() => {
    if (!cart.paymentMethod) {
      navigate("/payment");
    }
  }, [cart, navigate]);

  console.log(cart.cartItems.length);
  return (
    <>
      <Stepper activeStep={2} alternativeLabel sx={{ pt: 3, pb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {cart.cartItems.length != 0 ? (
        <React.Fragment>
          <Typography variant="h6" gutterBottom>
            Order summary
          </Typography>
          <List disablePadding>
            {cart.cartItems.map((product) => (
              <Box key={product.name}>
                <ListItem sx={{ py: 1, px: 0 }}>
                  <ListItemText
                    primary={product.name}
                    secondary={product.category}
                  />
                  <Typography variant="body2">{product.price}</Typography>
                </ListItem>
                <Divider textAlign="center">
                  <Chip label={product.quantity} />
                </Divider>
              </Box>
            ))}
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Total Items" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ({cart.cartItems.reduce((a, c) => a + c.quantity, 0)})
              </Typography>
            </ListItem>
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Total Price" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {cart.cartItems.reduce((a, c) => a + c.price * c.quantity, 0)}
              </Typography>
            </ListItem>
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Shipping Price" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {cart.shippingPrice}
              </Typography>
            </ListItem>
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Tax" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {cart.taxPrice}
              </Typography>
            </ListItem>
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Total" />
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, display: "flex", alignItems: "center" }}
              >
                <LocalAtmOutlined />
                {cart.totalPrice}
              </Typography>
            </ListItem>
          </List>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Shipping
              </Typography>
              <Typography gutterBottom>
                Name: {cart.shippingAddress.fullName}
              </Typography>
              <Typography gutterBottom>
                Address: {cart.shippingAddress.address}
              </Typography>
              <Typography gutterBottom>
                City: {cart.shippingAddress.city}
              </Typography>
              <Typography gutterBottom>
                Country: {cart.shippingAddress.country}
              </Typography>
              <Typography gutterBottom>
                Postal Code: {cart.shippingAddress.postalCode}
              </Typography>
            </Grid>
            <Grid item container direction="column" xs={12} sm={6}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Payment details
              </Typography>
              <Grid container>
                <Grid item xs={6}>
                  <Typography gutterBottom>{cart.paymentMethod}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => placeOrderHandler()}
              sx={{ mt: 3, ml: 1 }}
            >
              Submit
            </Button>
          </Box>
        </React.Fragment>
      ) : order == 1 ? (
        <React.Fragment>
          <Typography variant="h5" gutterBottom>
            Thank you for your order.
          </Typography>
          <Typography variant="subtitle1">
            We have emailed your order confirmation, and will send you an update
            when your order has shipped.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
            <Button onClick={navigate("/")}>Home</Button>
            <Button onClick={navigate("/orderhistory")}>My order</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ display: "flex", justifyContent: "center" }}
          >
            Your cart is empty
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "space-evenly", mt: "2rem" }}
          >
            <Button onClick={navigate("/")}>Home</Button>
            <Button onClick={navigate("/search")}>Order now</Button>
          </Box>
        </React.Fragment>
      )}
    </>
  );
}
