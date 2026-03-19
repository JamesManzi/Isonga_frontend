import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faCalendarCheck, 
  faClock, 
  faUser, 
  faCircle,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import "./BookingHistory.css";

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          "https://isonga-backend.onrender.com/api/seller/bookings",
          { withCredentials: true }
        );
        if (res.data.success) {
          setBookings(res.data.bookings);
          setFilteredBookings(res.data.bookings);
        }
      } catch (err) {
        console.error("History Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (filter === "All") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status.toLowerCase() === filter.toLowerCase()));
    }
  }, [filter, bookings]);

  if (loading) return <div className="history_loader">Loading History...</div>;

  return (
    <div className="history_container">
      <div className="history_header">
        <button className="back_circle_btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>Booking History</h1>
        <div className="history_count">{filteredBookings.length}</div>
      </div>

      <div className="filter_bar">
        {["All", "Pending", "Approved", "Rejected"].map((status) => (
          <button 
            key={status}
            className={filter === status ? "active" : ""} 
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="history_list">
        {filteredBookings.length === 0 ? (
          <div className="empty_history">
            <p>No {filter !== "All" ? filter : ""} bookings found.</p>
          </div>
        ) : (
          filteredBookings.map((item) => (
            <div key={item._id} className="history_card">
              <div className="history_card_left">
                <div className={`status_indicator ${item.status}`}></div>
                <div className="history_main_info">
                  <h3>{item.name}</h3>
                  <p><FontAwesomeIcon icon={faCalendarCheck} /> {new Date(item.date).toDateString()}</p>
                  <p><FontAwesomeIcon icon={faClock} /> {item.time}</p>
                </div>
              </div>
              
              <div className="history_card_right">
                <span className={`status_text ${item.status}`}>{item.status}</span>
                <button 
                  className="view_details_btn" 
                  onClick={() => navigate(`/booking_details/${item._id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BookingHistory;