import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../../Services/localStorageService";

const FeedbackSystem = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [admins, setAdmins] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 1;

  const token = getToken();
  const axiosInstance = axios.create({
    baseURL: "https://qlvtapi-production.up.railway.app/api/v1",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch logged-in user's userId
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/user/myInfo");
        const userData = response.data.data;
        setUserId(userData.id);
        setError("");
      } catch (error) {
        console.error("Error fetching user info:", error);
        setError("Không thể tải thông tin người dùng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  // Fetch list of admins/managers
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/user/admins-managers");
        setAdmins(response.data);
        setError("");
      } catch (error) {
        console.error("Error fetching admins:", error);
        setError("Không thể tải danh sách quản trị viên. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch user's requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (userId) {
        setLoading(true);
        try {
          const response = await axiosInstance.get("/requests/my-requests", {
            params: { userId },
          });
          setRequests(response.data);
          setError("");
        } catch (error) {
          console.error("Error fetching requests:", error);
          setError("Không thể tải danh sách yêu cầu. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRequests();
  }, [userId]);

  // Fetch messages for selected request
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedRequest && userId) {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/requests/${selectedRequest.id}`, {
            params: { userId },
          });
          setMessages(response.data.responses || []);
          setError("");
        } catch (error) {
          console.error("Error fetching request details:", error);
          setError("Không thể tải chi tiết yêu cầu. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMessages();
  }, [selectedRequest, userId]);

  // Create new request
  const handleCreateRequest = async () => {
    if (!title || !content || !toUserId) {
      setError("Vui lòng điền tiêu đề, nội dung và chọn người nhận!");
      return;
    }
    if (!userId) {
      setError("Không thể xác định người gửi. Vui lòng đăng nhập lại.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const requestDTO = { title, content, toUserId, userId };
      console.log("Sending requestDTO:", requestDTO);
      const response = await axiosInstance.post("/requests/create", requestDTO);
      setRequests([...requests, response.data]);
      setTitle("");
      setContent("");
      setToUserId("");
    } catch (error) {
      console.error("Error creating request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        setError(`Không thể tạo yêu cầu: ${error.response.data.message || "Vui lòng thử lại."}`);
      } else {
        setError("Không thể tạo yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Send response to a request
  const handleSendResponse = async () => {
    if (!newMessage || !selectedRequest) {
      setError("Vui lòng nhập phản hồi và chọn yêu cầu!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/requests/${selectedRequest.id}/respond`,
        null,
        { params: { responseContent: newMessage } }
      );
      setMessages([...messages, response.data.responses.slice(-1)[0]]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending response:", error);
      setError("Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a request
  const handleDeleteRequest = async (requestId) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/requests/${requestId}`);
      setRequests(requests.filter((request) => request.id !== requestId));
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(null);
        setMessages([]);
      }
      setError("");
    } catch (error) {
      console.error("Error deleting request:", error);
      setError("Không thể xóa yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(requests.length / requestsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Loading Indicator */}
      {loading && (
        <div className="text-center text-gray-600 mb-4">Đang tải...</div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}

      {/* Create New Request Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Tạo Yêu Cầu Mới</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu Đề Yêu Cầu
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề yêu cầu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội Dung Yêu Cầu
            </label>
            <textarea
              placeholder="Nhập nội dung yêu cầu"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows="4"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn Người Nhận
            </label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Chọn người nhận</option>
              {Array.isArray(admins) && admins.length > 0 ? (
                admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.firstname} {admin.lastname} ({admin.username})
                  </option>
                ))
              ) : (
                <option value="">Không có quản trị viên nào</option>
              )}
            </select>
          </div>
           <div className="flex justify-end space-x-2"><button
            onClick={handleCreateRequest}
            className="w-40 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
            disabled={loading}
          >
            Gửi Yêu Cầu
          </button></div>
          
        </div>
      </div>

      {/* Request List */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Yêu Cầu Của Tôi</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">Không có yêu cầu nào.</p>
        ) : (
          <>
            <div className="space-y-2">
              {currentRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-gray-200 rounded hover:bg-gray-100 transition"
                >
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="w-full text-left"
                    disabled={loading}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">{request.title}</span>
                        <p className="text-sm text-gray-500">
                          Gửi tới: {request.toUserId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span
                          className={`${
                            request.status === "APPROVED"
                              ? "text-green-600"
                              : request.status === "PENDING"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {request.status === "APPROVED"
                            ? "ĐÃ DUYỆT"
                            : request.status === "PENDING"
                            ? "ĐANG CHỜ"
                            : "TỪ CHỐI"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent button's onClick
                            handleDeleteRequest(request.id);
                          }}
                          className="text-red-600 hover:text-red-800 disabled:text-red-400"
                          disabled={loading}
                          title="Xóa yêu cầu"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0H6a1 1 0 00-1 1v1h14V4a1 1 0 00-1-1h-4z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {requests.length > requestsPerPage && (
              <div className="flex justify-end mt-4 space-x-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={loading}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Details and Responses */}
      {selectedRequest && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            Yêu Cầu: {selectedRequest.title}
          </h2>
          <p className="text-gray-600 mb-2">
            Trạng Thái:{" "}
            <span className="font-medium">
              {selectedRequest.status === "APPROVED"
                ? "ĐÃ DUYỆT"
                : selectedRequest.status === "PENDING"
                ? "ĐANG CHỜ"
                : "TỪ CHỐI"}
            </span>
          </p>
          <p className="text-gray-600 mb-4">
            Nội Dung: {selectedRequest.content}
          </p>
          <h3 className="text-lg font-semibold mb-2">Phản Hồi</h3>
          <textarea
            rows="4"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Nhập phản hồi của bạn..."
            disabled={loading}
          />
          <div className="flex justify-end space-x-2">
          <button
            onClick={handleSendResponse}
            className="w-40 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
            disabled={loading}
          >
            Gửi Phản Hồi
          </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackSystem;