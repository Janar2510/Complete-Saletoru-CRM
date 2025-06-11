import React, { useState } from 'react';
import { OffersTable } from '../components/offers/OffersTable';
import { OfferModal } from '../components/offers/OfferModal';
import { OfferDetailModal } from '../components/offers/OfferDetailModal';
import { Offer, CreateOfferData, UpdateOfferData } from '../types/offers';
import { OffersAPI } from '../lib/offers-api';

const Offers: React.FC = () => {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateOffer = () => {
    setSelectedOffer(null);
    setShowCreateModal(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowCreateModal(true);
  };

  const handleViewOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

  const handleSaveOffer = async (offerData: CreateOfferData | UpdateOfferData) => {
    try {
      if ('id' in offerData) {
        await OffersAPI.updateOffer(offerData);
      } else {
        await OffersAPI.createOffer(offerData);
      }
      
      setShowCreateModal(false);
      setShowDetailModal(false);
      setSelectedOffer(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setSelectedOffer(null);
  };

  return (
    <div className="space-y-6">
      <OffersTable
        key={refreshTrigger}
        onCreateOffer={handleCreateOffer}
        onEditOffer={handleEditOffer}
        onViewOffer={handleViewOffer}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <OfferModal
          offer={selectedOffer}
          onSave={handleSaveOffer}
          onClose={handleCloseModals}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          onClose={handleCloseModals}
          onEdit={handleEditOffer}
        />
      )}
    </div>
  );
};

export default Offers;