"use client";

import React, { useState } from "react";
import styles from "@/styles/approvalSection.module.scss"; // Create a corresponding SCSS file

export default function ApprovalSection() {
  const [recommendationStatus, setRecommendationStatus] = useState("");
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [recommendingBy, setRecommendingBy] = useState("");
  const [authorizedOfficial, setAuthorizedOfficial] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("");
  const [dueExigencyService, setDueExigencyService] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  // No external save/cancel handlers required here — keep internal state only

  return (
    <div className={styles.approvalSection}>
      {/* Recommendation Section */}
      <div className={styles.section}>
        <label>Recommendation Status</label>
        <select
          value={recommendationStatus}
          onChange={(e) => setRecommendationStatus(e.target.value)}
        >
          <option value="">Select</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Disapproved">Disapproved</option>
          <option value="Cancel">Cancel</option>
        </select>
      </div>

      <div className={styles.section}>
        <label>Recommendation Message</label>
        <textarea
          value={recommendationMessage}
          onChange={(e) => setRecommendationMessage(e.target.value)}
          placeholder="Enter details here"
        />
      </div>

      <div className={styles.section}>
        <label>
          Recommending Approval By{" "}
          <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
        </label>
        <input
          type="text"
          value={recommendingBy}
          onChange={(e) => setRecommendingBy(e.target.value)}
          placeholder="Enter full name"
        />
      </div>

      <div className={styles.section}>
        <label>
          Authorized Official{" "}
          <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
        </label>
        <input
          type="text"
          value={authorizedOfficial}
          onChange={(e) => setAuthorizedOfficial(e.target.value)}
          placeholder="Enter full name"
        />
      </div>

      {/* Approval Section */}
      <div className={styles.sectionInline}>
        <div className={styles.inlineLeft}>
          <label>Approved Status</label>
          <select
            value={approvedStatus}
            onChange={(e) => setApprovedStatus(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Disapproved">Disapproved</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>
        <div className={styles.inlineRight}>
          <label>
            <input
              type="checkbox"
              checked={dueExigencyService}
              onChange={(e) => setDueExigencyService(e.target.checked)}
            />
            Due Exigency Service
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <label>Approval Message</label>
        <textarea
          value={approvalMessage}
          onChange={(e) => setApprovalMessage(e.target.value)}
          placeholder="Enter details here"
        />
      </div>

      <div className={styles.section}>
        <label>
          Approved By{" "}
          <span className={styles.guide}>(Last Name, First Name or ID No.)</span>
        </label>
        <input
          type="text"
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          placeholder="Enter full name"
        />
      </div>
    </div>
  );
}