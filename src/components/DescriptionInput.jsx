import { useState } from 'react';

const DescriptionInput = ({ value, onChange, history = [], labelColor }) => {
    return (
        <div className="w-full">
            <label htmlFor="description-input" className={labelColor}>Açıklama</label>
            <input
                id="description-input"
                list="description-history"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Örn: Google Ads Ödemesi"
                className="w-full"
                autoComplete="off"
            />
            <datalist id="description-history">
                {history.map((item, index) => (
                    <option key={index} value={item} />
                ))}
            </datalist>
        </div>
    );
};

export default DescriptionInput;
