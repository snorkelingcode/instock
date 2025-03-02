                  </div>
                </li>
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Pokemon 151</h3>
                      <p className="text-sm text-gray-700">Special Set</p>
                    </div>
                    <span className="text-sm text-gray-600">June 7, 2025</span>
                  </div>
                </li>
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Champion's Path 2</h3>
                      <p className="text-sm text-gray-700">Premium Collection</p>
                    </div>
                    <span className="text-sm text-gray-600">July 12, 2025</span>
                  </div>
                </li>
                <li>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Temporal Forces</h3>
                      <p className="text-sm text-gray-700">Main Set</p>
                    </div>
                    <span className="text-sm text-gray-600">August 23, 2025</span>
                  </div>
                </li>
              </ul>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/products/upcoming">View All Upcoming Releases</Link>
                </Button>
              </div>
            </div>
            
            {/* Advertisement in sidebar */}
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-2">Advertisement</p>
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-400">
                <p className="text-gray-500">Google AdSense (300×250)</p>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default NewsPage;
